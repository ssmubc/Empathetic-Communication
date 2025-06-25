import boto3, re, json, logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

from langchain_aws import ChatBedrock
from langchain_aws import BedrockLLM
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import DynamoDBChatMessageHistory
from langchain_core.pydantic_v1 import BaseModel, Field

class LLM_evaluation(BaseModel):
    response: str = Field(description="Assessment of the student's answer with a follow-up question.")
    verdict: str = Field(description="'True' if the student has properly diagnosed the patient, 'False' otherwise.")


def create_dynamodb_history_table(table_name: str) -> bool:
    """
    Create a DynamoDB table to store the session history if it doesn't already exist.

    Args:
    table_name (str): The name of the DynamoDB table to create.

    Returns:
    None
    
    If the table already exists, this function does nothing. Otherwise, it creates a 
    new table with a key schema based on 'SessionId'.
    """
    # Get the service resource and client.
    dynamodb_resource = boto3.resource("dynamodb")
    dynamodb_client = boto3.client("dynamodb")
    
    # Retrieve the list of tables that currently exist.
    existing_tables = []
    exclusive_start_table_name = None
    
    while True:
        if exclusive_start_table_name:
            response = dynamodb_client.list_tables(ExclusiveStartTableName=exclusive_start_table_name)
        else:
            response = dynamodb_client.list_tables()
        
        existing_tables.extend(response.get('TableNames', []))
        
        if 'LastEvaluatedTableName' in response:
            exclusive_start_table_name = response['LastEvaluatedTableName']
        else:
            break
    
    if table_name not in existing_tables:  # Create a new table if it doesn't exist.
        # Create the DynamoDB table.
        table = dynamodb_resource.create_table(
            TableName=table_name,
            KeySchema=[{"AttributeName": "SessionId", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "SessionId", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        
        # Wait until the table exists.
        table.meta.client.get_waiter("table_exists").wait(TableName=table_name)

def get_bedrock_llm(
    bedrock_llm_id: str,
    temperature: float = 0
) -> ChatBedrock:
    """
    Retrieve a Bedrock LLM instance based on the provided model ID.

    Args:
    bedrock_llm_id (str): The unique identifier for the Bedrock LLM model.
    temperature (float, optional): The temperature parameter for the LLM, controlling 
    the randomness of the generated responses. Defaults to 0.

    Returns:
    ChatBedrock: An instance of the Bedrock LLM corresponding to the provided model ID.
    """
    return ChatBedrock(
        model_id=bedrock_llm_id,
        model_kwargs=dict(temperature=temperature),
    )

def get_student_query(raw_query: str) -> str:
    """
    Format the student's raw query into a specific template suitable for processing.

    Args:
    raw_query (str): The raw query input from the student.

    Returns:
    str: The formatted query string ready for further processing.
    """
    student_query = f"""
    user
    {raw_query}
    
    """
    return student_query

def get_initial_student_query(patient_name: str) -> str:
    """
    Generate an initial query for the student to interact with the system. 
    The query asks the student to greet the system and then requests a question related to a specified patient.

    Args:
    patient_name (str): The name of the patient for which the initial question should be generated.

    Returns:
    str: The formatted initial query string for the student.
    """
    student_query = f"""
    user
    Greet me and then ask me a question related to the patient: {patient_name}. 
    """
    return student_query

def get_response(
    query: str,
    patient_name: str,
    llm: ChatBedrock,
    history_aware_retriever,
    table_name: str,
    session_id: str,
    system_prompt: str,
    patient_age: str,
    patient_prompt: str,
    llm_completion: bool
) -> dict:
    """
    Generates a response to a query using the LLM and a history-aware retriever for context.

    Args:
    query (str): The student's query string for which a response is needed.
    patient_name (str): The specific patient that the student needs to diagnose.
    llm (ChatBedrock): The language model instance used to generate the response.
    history_aware_retriever: The history-aware retriever instance that provides relevant context documents for the query.
    table_name (str): The DynamoDB table name used to store and retrieve the chat history.
    session_id (str): The unique identifier for the chat session to manage history.

    Returns:
    dict: A dictionary containing the generated response and the source documents used in the retrieval.
    """
    
    # Evaluate empathy if this is a student response (not initial greeting)
    empathy_evaluation = None
    empathy_feedback = ""
    if query.strip() and "Greet me" not in query:
        patient_context = f"Patient: {patient_name}, Age: {patient_age}, Condition: {patient_prompt}"
        nova_client = {
            "client": boto3.client("bedrock-runtime", region_name="us-east-1"),
            "model_id": "amazon.nova-pro-v1:0"
        }
        empathy_evaluation = evaluate_empathy(query, patient_context, nova_client)
        
        if empathy_evaluation:
            empathy_score = empathy_evaluation.get('empathy_score', 'unknown')
            realism_flag = empathy_evaluation.get('realism_flag', 'unknown')
            feedback = empathy_evaluation.get('feedback', {})
            
            empathy_feedback = f"[EMPATHY COACH: Your empathy score is {empathy_score.upper()} and your response is {realism_flag.upper()}. "
            
            if isinstance(feedback, dict):
                if 'what_did_well' in feedback:
                    empathy_feedback += f"\nStrengths: {feedback['what_did_well']}"
                
                if 'areas_for_improvement' in feedback and feedback['areas_for_improvement']:
                    empathy_feedback += "\nAreas to improve: "
                    for area in feedback['areas_for_improvement'][:2]:  # Limit to 2 areas
                        empathy_feedback += f"\n- {area}"
                
                if 'alternative_phrasing_suggestions' in feedback and feedback['alternative_phrasing_suggestions']:
                    empathy_feedback += "\nTry saying: "
                    empathy_feedback += f"\n\"{feedback['alternative_phrasing_suggestions'][0]}\""
            else:
                empathy_feedback += f"\nFeedback: {feedback}"
                
            empathy_feedback += "]\n\n"
    
    completion_string = """
                Once I, the pharmacy student, have give you a diagnosis, politely leave the conversation and wish me goodbye.
                Regardless if I have given you the proper diagnosis or not for the patient you are pretending to be, stop talking to me.
                """
    if llm_completion:
        completion_string = """
                Continue this process until you determine that me, the pharmacy student, has properly diagnosed the patient you are pretending to be.
                Once the proper diagnosis is provided, include PROPER DIAGNOSIS ACHIEVED in your response and do not continue the conversation.
                """

    # Create a system prompt for the question answering
    system_prompt = (
        f"""
        <|begin_of_text|>
        <|start_header_id|>patient<|end_header_id|>
        You are a patient, I am a pharmacy student. Your name is {patient_name} and you are going to pretend to be a patient talking to me, a pharmacy student.
        You are not the pharmacy student. You are the patient. Look at the document(s) provided to you and act as a patient with those symptoms.
        Please pay close attention to this: {system_prompt} 
        Start the conversion by saying Hello! I'm {patient_name}, I am {patient_age} years old, and then further talk about the symptoms you have. 
        Here are some additional details about your personality, symptoms, or overall condition: {patient_prompt}
        {completion_string}
        Use the following document(s) to provide
        hints as a patient to me, the pharmacy student. Use three sentences maximum when describing your symptoms to provide clues to me, the pharmacy student.
        End each clue with a question that pushes me to the correct diagnosis. I might ask you questions or provide my thoughts as statements.
        Again, YOU ARE SUPPOSED TO ACT AS THE PATIENT. I AM THE PHARMACY STUDENT. 
        <|eot_id|>
        <|start_header_id|>documents<|end_header_id|>
        {{context}}
        <|eot_id|>
        """
    )
    
    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        lambda session_id: DynamoDBChatMessageHistory(
            table_name=table_name, 
            session_id=session_id
        ),
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )
    
    # Generate the response until it's not empty
    response = ""
    while not response:
        response = generate_response(
            conversational_rag_chain,
            query,
            session_id
        )
    
    result = get_llm_output(response, llm_completion, empathy_feedback)
    if empathy_evaluation:
        result["empathy_evaluation"] = empathy_evaluation
    
    return result

def generate_response(conversational_rag_chain: object, query: str, session_id: str) -> str:
    """
    Invokes the RAG chain to generate a response to a given query.

    Args:
    conversational_rag_chain: The Conversational RAG chain object that processes the query and retrieves relevant responses.
    query (str): The input query for which the response is being generated.
    session_id (str): The unique identifier for the current conversation session.

    Returns:
    str: The answer generated by the Conversational RAG chain, based on the input query and session context.
    """
    return conversational_rag_chain.invoke(
        {
            "input": query
        },
        config={
            "configurable": {"session_id": session_id}
        },  # constructs a key "session_id" in `store`.
    )["answer"]

def get_llm_output(response: str, llm_completion: bool, empathy_feedback: str = "") -> dict:
    """
    Processes the response from the LLM to determine if proper diagnosis has been achieved.

    Args:
    response (str): The response generated by the LLM.
    llm_completion (bool): Whether to check for completion.
    empathy_feedback (str, optional): Empathy feedback to prepend to the response.

    Returns:
    dict: A dictionary containing the processed output from the LLM and a boolean 
    flag indicating whether proper diagnosis has been achieved.
    """

    completion_sentence = " Congratulations! You have provided the proper diagnosis for me, the patient I am pretending to be! Please try other mock patients to continue your diagnosis skills! :)"

    if not llm_completion:
        return dict(
            llm_output=empathy_feedback + response,
            llm_verdict=False
        )
    
    elif "PROPER DIAGNOSIS ACHIEVED" not in response:
        return dict(
            llm_output=empathy_feedback + response,
            llm_verdict=False
        )
    
    elif "PROPER DIAGNOSIS ACHIEVED" in response:
        sentences = split_into_sentences(response)
        
        for i in range(len(sentences)):
            
            if "PROPER DIAGNOSIS ACHIEVED" in sentences[i]:
                llm_response=' '.join(sentences[0:i-1])
                
                if sentences[i-1][-1] == '?':
                    return dict(
                        llm_output=empathy_feedback + llm_response,
                        llm_verdict=False
                    )
                else:
                    return dict(
                        llm_output=empathy_feedback + llm_response + completion_sentence,
                        llm_verdict=True
                    )

def split_into_sentences(paragraph: str) -> list[str]:
    """
    Splits a given paragraph into individual sentences using a regular expression to detect sentence boundaries.

    Args:
    paragraph (str): The input text paragraph to be split into sentences.

    Returns:
    list: A list of strings, where each string is a sentence from the input paragraph.

    This function uses a regular expression pattern to identify sentence boundaries, such as periods, question marks, 
    or exclamation marks, and avoids splitting on abbreviations (e.g., "Dr." or "U.S.") by handling edge cases. The 
    resulting list contains sentences extracted from the input paragraph.
    """
    # Regular expression pattern
    sentence_endings = r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s'
    sentences = re.split(sentence_endings, paragraph)
    return sentences

def evaluate_empathy(student_response: str, patient_context: str, bedrock_client) -> dict:
    """
    Evaluate empathy score and realism of student response.
    
    Args:
    student_response (str): The student's response to evaluate
    patient_context (str): Context about the patient's condition
    bedrock_client: Bedrock client for Nova Pro
    
    Returns:
    dict: Contains empathy_score, realism_flag, and feedback
    """

    evaluation_prompt = f"""
    You are an expert healthcare communication coach. Evaluate this pharmacy student's response and provide detailed coaching feedback.

    Patient Context: {patient_context}
    Student Response: {student_response}

    Examples of scoring:

    GREAT empathy (score: great):
    - "I can see this is really frightening for you, and that's completely understandable given what you're experiencing. Let's work through this together step by step."
    - "It sounds like you're carrying a lot of worry about your family right now. That shows how much you care about them, and I want to make sure we address all your concerns."

    GOOD empathy (score: good):
    - "I understand this must be very difficult for you. Let's discuss your treatment options."
    - "I can see you're worried. It's completely normal to feel this way."

    OK empathy (score: ok):
    - "I see you're concerned about this. Let me explain what we can do."
    - "That sounds difficult. Here's what I recommend."

    BAD empathy (score: bad):
    - "That's not my problem."
    - "Just take the medication."
    - "Don't worry about it."

    UNREALISTIC responses (flag: unrealistic):
    - Telling terminal cancer patient "You'll be fine tomorrow"
    - Promising miraculous cures
    - Dismissing serious symptoms
    - "This medication will definitely cure you completely"

    COACHING FEEDBACK:
    Provide specific, actionable feedback including:
    - What the student did well
    - Areas for improvement
    - Alternative phrasing suggestions
    - Why certain approaches work better
    - How to strengthen empathetic communication

    Respond in JSON format:
    {{
        "empathy_score": "bad|ok|good|great",
        "realism_flag": "realistic|unrealistic",
        "feedback": "Detailed coaching feedback with specific suggestions and alternative phrasing examples"
    }}
    """

    body = {
        "messages": [{
            "role": "user",
            "content": [{"text": evaluation_prompt}]
        }],
        "inferenceConfig": {
            "temperature": 0.1,
            "maxTokens": 500
        }
    }
    
    try:
        response = bedrock_client["client"].invoke_model(
            modelId=bedrock_client["model_id"],
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body)
        )
        
        result = json.loads(response["body"].read())
        logger.info(f"LLM RESPONSE: {result}")
        response_text = result["output"]["message"]["content"][0]["text"]
        
        # Clean response text and parse JSON
        try:
            evaluation = json.loads(response_text.strip())
            return evaluation
        except json.JSONDecodeError:
            # Fallback if Nova Pro doesn't return valid JSON
            logger.warning(f"Invalid JSON from Nova Pro: {response_text}")
            return {
                "empathy_score": "ok",
                "realism_flag": "realistic",
                "feedback": "Unable to parse evaluation"
            }
        
    except Exception as e:
        logger.error(f"Error evaluating empathy: {e}")
        return {
            "empathy_score": "ok",
            "realism_flag": "realistic",
            "feedback": "Unable to evaluate"
        }

def update_session_name(table_name: str, session_id: str, bedrock_llm_id: str) -> str:
    """
    Check if both the LLM and the student have exchanged exactly one message each.
    If so, generate and return a session name using the content of the student's first message
    and the LLM's first response. Otherwise, return None.

    Args:
    session_id (str): The unique ID for the session.
    table_name (str): The DynamoDB table name where the conversation history is stored.

    Returns:
    str: The updated session name if conditions are met, otherwise None.
    """
    
    dynamodb_client = boto3.client("dynamodb")
    
    # Retrieve the conversation history from the DynamoDB table
    try:
        response = dynamodb_client.get_item(
            TableName=table_name,
            Key={
                'SessionId': {
                    'S': session_id
                }
            }
        )
    except Exception as e:
        print(f"Error fetching conversation history from DynamoDB: {e}")
        return None

    history = response.get('Item', {}).get('History', {}).get('L', [])



    human_messages = []
    ai_messages = []
    
    # Find the first human and ai messages in the history
    # Check if length of human messages is 2 since the prompt counts as 1
    # Check if length of AI messages is 2 since after first response by student, another response is generated
    for item in history:
        message_type = item.get('M', {}).get('data', {}).get('M', {}).get('type', {}).get('S')
        
        if message_type == 'human':
            human_messages.append(item)
            if len(human_messages) > 2:
                print("More than one student message found; not the first exchange.")
                return None
        
        elif message_type == 'ai':
            ai_messages.append(item)
            if len(ai_messages) > 2:
                print("More than one AI message found; not the first exchange.")
                return None

    if len(human_messages) != 2 or len(ai_messages) != 2:
        print("Not a complete first exchange between the LLM and student.")
        return None
    
    student_message = human_messages[0].get('M', {}).get('data', {}).get('M', {}).get('content', {}).get('S', "")
    llm_message = ai_messages[0].get('M', {}).get('data', {}).get('M', {}).get('content', {}).get('S', "")
    
    llm = BedrockLLM(
                        model_id = bedrock_llm_id
                    )
    
    system_prompt = """
        You are given the first message from an AI and the first message from a student in a conversation. 
        Based on these two messages, come up with a name that describes the conversation. 
        The name should be less than 30 characters. ONLY OUTPUT THE NAME YOU GENERATED. NO OTHER TEXT.
    """
    
    prompt = f"""
        <|begin_of_text|>
        <|start_header_id|>system<|end_header_id|>
        {system_prompt}
        <|eot_id|>
        <|start_header_id|>AI Message<|end_header_id|>
        {llm_message}
        <|eot_id|>
        <|start_header_id|>Student Message<|end_header_id|>
        {student_message}
        <|eot_id|>
        <|start_header_id|>assistant<|end_header_id|>
    """
    
    session_name = llm.invoke(prompt)
    return session_name