# chat.py

## Table of Contents <a name="table-of-contents"></a>
- [Script Overview](#script-overview)
  - [Import Libraries](#import-libraries)
  - [AWS and LLM Integration](#aws-and-llm-integration)
  - [Helper Functions](#helper-functions)
  - [Execution Flow](#execution-flow)
- [Detailed Function Descriptions](#detailed-function-descriptions)
  - [Function: `create_dynamodb_history_table`](#create_dynamodb_history_table)
  - [Function: `get_bedrock_llm`](#get_bedrock_llm)
  - [Function: `get_student_query`](#get_student_query)
  - [Function: `get_initial_student_query`](#get_initial_student_query)
  - [Function: `get_response`](#get_response)
  - [Function: `split_into_sentences`](#split_into_sentences)
  - [Function: `get_llm_output`](#get_llm_output)

## Script Overview <a name="script-overview"></a>
This script integrates AWS services like DynamoDB and Bedrock LLM with LangChain to create an educational chatbot that can engage with students, ask questions, provide answers, and track student progress toward mastery of a topic. It also includes history-aware functionality, which uses chat history to provide relevant context during conversations.

### Import Libraries <a name="import-libraries"></a>
- **boto3**: AWS SDK to interact with services like DynamoDB and manage resources.
- **re**: The re library in Python is used for working with regular expressions, which are sequences of characters that form search patterns.
- **ChatBedrock**: Interface for interacting with AWS Bedrock LLM.
- **ChatPromptTemplate, MessagesPlaceholder**: Templates for setting up prompts in LangChain with chat history awareness.
- **create_stuff_documents_chain, create_retrieval_chain**: LangChain utilities to combine document chains and retrieval chains for context-aware question-answering.
- **RunnableWithMessageHistory**: Allows the inclusion of chat history in the reasoning chain.
- **DynamoDBChatMessageHistory**: Stores chat history in DynamoDB.

### AWS and LLM Integration <a name="aws-and-llm-integration"></a>
- **DynamoDB**: Used to store and retrieve session history for conversations between the student and the chatbot.
- **ChatBedrock**: Used to interact with AWS Bedrock LLM for generating responses and engaging with the student.

### Helper Functions <a name="helper-functions"></a>
- **create_dynamodb_history_table**: Creates a DynamoDB table to store chat session history if it doesn't already exist.
- **get_bedrock_llm**: Retrieves an instance of the Bedrock LLM based on a provided model ID.
- **get_student_query**: Formats a student's query into a structured template suitable for processing.
- **get_initial_student_query**: Generates an initial prompt for a student to greet the chatbot and request a question on a specific topic.
- **get_response**: Manages the interaction between the student query, the Bedrock LLM, and the history-aware retriever to generate responses.
- **get_llm_output**: Processes the output from the LLM and checks if the student has properly diagnosed the patient or not.

### Execution Flow <a name="execution-flow"></a>
1. **DynamoDB Table Creation**: The `create_dynamodb_history_table` function ensures that a DynamoDB table is available to store session history.
2. **Query Processing**: The `get_student_query` and `get_initial_student_query` functions format student queries for processing.
3. **Response Generation**: The `get_response` function uses the Bedrock LLM and chat history to generate responses to student queries and evaluates the student's progress toward mastering the topic.
4. **Proper Diagnosis Evaluation**: The `get_llm_output` function checks if the LLM response indicates that the student has properly diagnosed the student.

## Detailed Function Descriptions <a name="detailed-function-descriptions"></a>

### Function: `create_dynamodb_history_table` <a name="create_dynamodb_history_table"></a>
```python
def create_dynamodb_history_table(table_name: str) -> None:
    # Get the service resource and client.
    dynamodb_resource = boto3.resource("dynamodb")
    dynamodb_client = boto3.client("dynamodb")
    
    # Retrieve the list of tables that currently exist.
    existing_tables = dynamodb_client.list_tables()['TableNames']
    
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
```
#### Purpose
Creates a DynamoDB table to store the chat session history if the table doesn't already exist.

#### Process Flow
1. **Check Existing Tables**: Retrieves the list of existing DynamoDB tables.
2. **Table Creation**: If the specified table does not exist, creates it with a `SessionId` key schema and sets up pay-per-request billing mode.
3. **Wait for Table**: Waits for the table creation to complete before returning.

#### Inputs and Outputs
- **Inputs**:
  - `table_name`: The name of the DynamoDB table to create.
  
- **Outputs**:
  - No return value. The function ensures that the specified table exists.

---

### Function: `get_bedrock_llm` <a name="get_bedrock_llm"></a>
```python
def get_bedrock_llm(
    bedrock_llm_id: str,
    temperature: float = 0
) -> ChatBedrock:
    return ChatBedrock(
        model_id=bedrock_llm_id,
        model_kwargs=dict(temperature=temperature),
    )
```
#### Purpose
Retrieves a Bedrock LLM instance based on the provided model ID, with optional control over response randomness through the `temperature` parameter.

#### Process Flow
1. **Create LLM Instance**: Initializes a `ChatBedrock` instance with the specified model ID and temperature setting.
2. **Return LLM**: Returns the initialized LLM instance.

#### Inputs and Outputs
- **Inputs**:
  - `bedrock_llm_id`: The model ID for the Bedrock LLM.
  - `temperature`: Controls the randomness of the LLM's responses (default is 0 for deterministic outputs).
  
- **Outputs**:
  - Returns a `ChatBedrock` instance.

---

### Function: `get_student_query` <a name="get_student_query"></a>
```python
def get_student_query(raw_query: str) -> str:
    student_query = f"""
    user
    {raw_query}
    
    """
    return student_query
```
#### Purpose
Formats a raw student query into a structured template suitable for further processing by the LLM.

#### Process Flow
1. **Format Query**: Wraps the student's query with the `user` label to structure it for the LLM.
2. **Return Formatted Query**: Returns the structured query.

#### Inputs and Outputs
- **Inputs**:
  - `raw_query`: The raw query input from the student.
  
- **Outputs**:
  - Returns the formatted query string.

---

### Function: `get_initial_student_query` <a name="get_initial_student_query"></a>
```python
def get_initial_student_query(topic: str) -> str:
    student_query = f"""
    user
    Greet me and then ask me a question related to the topic: {topic}. 
    """
    return student_query
```
#### Purpose
Generates an initial prompt asking the student to greet the system and pose a question related to a specific topic.

#### Process Flow
1. **Generate Initial Query**: Constructs a query asking the student to greet the system and inquire about a specific topic.
2. **Return Query**: Returns the generated query.

#### Inputs and Outputs
- **Inputs**:
  - `topic`: The topic for which the initial question should be generated.
  
- **Outputs**:
  - Returns the formatted initial query string.

---

### Function: `get_response` <a name="get_response"></a>
```python
def get_response(
    query: str,
    topic: str,
    llm: ChatBedrock,
    history_aware_retriever,
    table_name: str,
    session_id: str,
    system_prompt: str,
    patient_prompt: str,
    llm_completion: bool
) -> dict:
    
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
        You are a patient, I am a pharmacy student. Your name is {topic} and you are going to pretend to be a patient talking to me, a pharmacy student.
        You are not the pharmacy student. You are the patient. Look at the document(s) provided to you and act as a patient with those symptoms.
        Please pay close attention to this: {system_prompt}
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
    
    return get_llm_output(response, llm_completion)
```
#### Purpose
Generates a response to the student's query using the LLM and a history-aware retriever, incorporating context from previous conversations stored in DynamoDB.

#### Process Flow
1. **Prompt Setup**: Creates a system prompt instructing the LLM to help the student master a specific topic, engaging them in conversation and filling gaps in their understanding.
2. **Contextual Question Answering**: Uses a retrieval chain to fetch relevant documents based on the student's query and chat history.
3. **Chat History Handling**: The conversation history is managed using `DynamoDBChatMessageHistory` for the specific session.
4. **Generate Response**: Generates the response using the LLM and returns the result.

#### Inputs and Outputs
- **Inputs**:
  - `query`: The student's query string.
  - `topic`: The topic the student is learning about.
  - `llm`: The Bedrock LLM instance.
  - `history_aware_retriever`: The retriever providing relevant documents for the query.
  - `table_name`: DynamoDB table name used to store the chat history.
  - `session_id`: Unique identifier for the chat session.
  
- **Outputs**:
  - Returns a dictionary containing the response and the source documents used for retrieval.

---

### Function: `split_into_sentences` <a name="split_into_sentences"></a>
```python
def split_into_sentences(paragraph: str) -> list[str]:
    # Regular expression pattern
    sentence_endings = r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s'
    sentences = re.split(sentence_endings, paragraph)
    return sentences
```
#### Purpose
Splits a given paragraph into individual sentences using a regular expression to detect sentence boundaries while avoiding incorrect splits at abbreviations and edge cases.

#### Process Flow
1. **Regular Expression Pattern**: The pattern `sentence_endings` is designed to identify sentence boundaries marked by periods (`.`), question marks (`?`), or exclamation marks (`!`) followed by a whitespace character. Negative lookbehind assertions are used to prevent splitting on common abbreviations (e.g., "Dr.", "U.S."). Here is a breakdown of the regular expression pattern:
    - `(?<!\w\.\w.)`: Negative lookbehind to avoid splitting within abbreviations like "e.g." or "U.S."
    - `(?<![A-Z][a-z]\.)`: Negative lookbehind to avoid splitting after titles like "Dr." or "Mrs."
    - `(?<=\.|\?|\!)`: Positive lookbehind to ensure the split occurs after a period (.), question mark (?), or exclamation mark (!).
    - `\s`: Matches a whitespace character where the actual split will occur.
3. **Split a paragraph into sentences**: The `re.split()` function uses the `sentence_endings` pattern to split the input paragraph into a list of sentences. This results in a list where each element is a sentence extracted from the paragraph. 
4. **Return sentences list**: The function returns the list of sentences for further processing.

#### Inputs and Outputs
- **Inputs**:
  - `paragraph` (*str*): The input text paragraph to be split into sentences.
  
- **Outputs**:
  - Returns a `list[str]`: A list where each element is a sentence from the input paragraph.

---

### Function: `get_llm_output` <a name="get_llm_output"></a>
```python
def get_llm_output(response: str, llm_completion: bool) -> dict:

    completion_sentence = " Congratulations! You have provided the proper diagnosis for me, the patient I am pretending to be! Please try other mock patients to continue your diagnosis skills! :)"

    if not llm_completion:
        return dict(
            llm_output=response,
            llm_verdict=False
        )
    
    elif "PROPER DIAGNOSIS ACHIEVED" not in response:
        return dict(
            llm_output=response,
            llm_verdict=False
        )
    
    elif "PROPER DIAGNOSIS ACHIEVED" in response:
        sentences = split_into_sentences(response)
        
        for i in range(len(sentences)):
            
            if "PROPER DIAGNOSIS ACHIEVED" in sentences[i]:
                llm_response=' '.join(sentences[0:i-1])
                
                if sentences[i-1][-1] == '?':
                    return dict(
                        llm_output=llm_response,
                        llm_verdict=False
                    )
                else:
                    return dict(
                        llm_output=llm_response + completion_sentence,
                        llm_verdict=True
                    )
```
#### Purpose
Processes the response from the LLM to determine if the proper diagnosis of the patient has been found by the student, and extracts the relevant output.

#### Process Flow
1. **Check for "PROPER DIAGNOSIS ACHIEVED" Absence**: If **"PROPER DIAGNOSIS ACHIEVED"** is **not** in the response, return the original response with `llm_verdict` set to `False`.
2. **Check for "PROPER DIAGNOSIS ACHIEVED" Presence**: If **"PROPER DIAGNOSIS ACHIEVED"** is in the response:
  - Splits the response into sentences using `split_into_sentences(response)`.
  - Iterates through the sentences to find the one containing **"PROPER DIAGNOSIS ACHIEVED"**.
  - Extracts all sentences before **"PROPER DIAGNOSIS ACHIEVED"** and joins them into `llm_response`.
  - Checks the punctuation of the sentence immediately before **"PROPER DIAGNOSIS ACHIEVED"**:
    - If the preceding sentence ends with a question mark (`?`):
      - Sets `llm_verdict` to `False` (indicating the proper diagnosis was not found).
    - Else:
      - Sets `llm_verdict` to `True` (indicating the proper diagnosis was found).
  - Returns `llm_response` and `llm_verdict`.

#### Inputs and Outputs
- **Inputs**:
  - `response`: The response generated by the LLM.
  
- **Outputs**:
  - Returns a dictionary with the LLM's output and a boolean indicating whether the student has properly diagnosed the mock patient.

[🔼 Back to top](#table-of-contents)
