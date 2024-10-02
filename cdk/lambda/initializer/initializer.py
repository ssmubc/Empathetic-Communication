import os
import json
import boto3
import psycopg2
from psycopg2.extensions import AsIs
import secrets

DB_SECRET_NAME = os.environ["DB_SECRET_NAME"]
DB_USER_SECRET_NAME = os.environ["DB_USER_SECRET_NAME"]
DB_PROXY = os.environ["DB_PROXY"]
print(psycopg2.__version__)


def getDbSecret():
    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(SecretId=DB_SECRET_NAME)["SecretString"]
    secret = json.loads(response)
    return secret

def createConnection():

    connection = psycopg2.connect(
        user=dbSecret["username"],
        password=dbSecret["password"],
        host=dbSecret["host"],
        dbname=dbSecret["dbname"],
        # sslmode="require"
    )
    return connection


dbSecret = getDbSecret()
connection = createConnection()


def handler(event, context):
    global connection
    print(connection)
    if connection.closed:
        connection = createConnection()
    
    cursor = connection.cursor()
    try:

        #
        ## Create tables and schema
        ##

        # Create tables based on the schema
        sqlTableCreation = """
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE TABLE IF NOT EXISTS "Users" (
                "user_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "user_email" varchar UNIQUE,
                "username" varchar,
                "first_name" varchar,
                "last_name" varchar,
                "preferred_name" varchar,
                "time_account_created" timestamp,
                "roles" varchar[],
                "last_sign_in" timestamp
            );

            CREATE TABLE IF NOT EXISTS "Patients" (
                "patient_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "patient_name" varchar,
                "patient_gender" varchar,
                "patient_age" integer,
                "patient_allergies" varchar,
                "diagnosis" varchar,
                "admission_date" timestamp
            );

            CREATE TABLE IF NOT EXISTS "Patient_Files" (
                "file_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "patient_id" uuid,
                "filetype" varchar,
                "s3_bucket_reference" varchar,
                "filepath" varchar,
                "filename" varchar,
                "time_uploaded" timestamp,
                "metadata" text
            );

            CREATE TABLE IF NOT EXISTS "Enrolments" (
                "enrolment_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "user_id" uuid,
                "patient_id" uuid,
                "enrolment_type" varchar,
                "time_enroled" timestamp
            );

            CREATE TABLE IF NOT EXISTS "Sessions" (
                "session_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "patient_id" uuid,
                "session_name" varchar,
                "session_context_embeddings" float[],
                "last_accessed" timestamp
            );

            CREATE TABLE IF NOT EXISTS "Messages" (
                "message_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "session_id" uuid,
                "student_sent" bool,
                "message_content" varchar,
                "time_sent" timestamp
            );

            CREATE TABLE IF NOT EXISTS "User_Engagement_Log" (
                "log_id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
                "user_id" uuid,
                "patient_id" uuid,
                "enrolment_id" uuid,
                "timestamp" timestamp,
                "engagement_type" varchar,
                "engagement_details" text
            );

            -- Add foreign keys
            ALTER TABLE "User_Engagement_Log" ADD FOREIGN KEY ("enrolment_id") REFERENCES "Enrolments" ("enrolment_id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "User_Engagement_Log" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "User_Engagement_Log" ADD FOREIGN KEY ("patient_id") REFERENCES "Patients" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

            ALTER TABLE "Patient_Files" ADD FOREIGN KEY ("patient_id") REFERENCES "Patients" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

            ALTER TABLE "Enrolments" ADD FOREIGN KEY ("patient_id") REFERENCES "Patients" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;
            ALTER TABLE "Enrolments" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

            ALTER TABLE "Sessions" ADD FOREIGN KEY ("patient_id") REFERENCES "Patients" ("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

            ALTER TABLE "Messages" ADD FOREIGN KEY ("session_id") REFERENCES "Sessions" ("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'unique_patient_user'
                    AND conrelid = '"Enrolments"'::regclass
                ) THEN
                    ALTER TABLE "Enrolments" ADD CONSTRAINT unique_patient_user UNIQUE (patient_id, user_id);
                END IF;
            END $$;

        """

        # Execute table creation
        cursor.execute(sqlTableCreation)
        connection.commit()

        # Generate 16 bytes username and password randomly
        username = secrets.token_hex(8)
        password = secrets.token_hex(16)
        usernameTableCreator = secrets.token_hex(8)
        passwordTableCreator = secrets.token_hex(16)

        # Create a user with the following permissions: SELECT, INSERT, UPDATE, DELETE
        sqlCreateUser = """
            DO $$
            BEGIN
                CREATE ROLE readwrite;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Role already exists.';
            END
            $$;

            GRANT CONNECT ON DATABASE postgres TO readwrite;

            GRANT USAGE ON SCHEMA public TO readwrite;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO readwrite;
            GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO readwrite;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO readwrite;

            CREATE USER "%s" WITH PASSWORD '%s';
            GRANT readwrite TO "%s";
        """

        sqlCreateTableCreator = """
            DO $$
            BEGIN
                CREATE ROLE tablecreator;
            EXCEPTION
                WHEN duplicate_object THEN
                    RAISE NOTICE 'Role already exists.';
            END
            $$;

            GRANT CONNECT ON DATABASE postgres TO tablecreator;

            GRANT USAGE, CREATE ON SCHEMA public TO tablecreator;
            GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tablecreator;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tablecreator;
            GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO tablecreator;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO tablecreator;

            CREATE USER "%s" WITH PASSWORD '%s';
            GRANT tablecreator TO "%s";
        """

        # Execute user creation
        cursor.execute(
            sqlCreateUser,
            (
                AsIs(username),
                AsIs(password),
                AsIs(username),
            ),
        )
        connection.commit()
        cursor.execute(
            sqlCreateTableCreator,
            (
                AsIs(usernameTableCreator),
                AsIs(passwordTableCreator),
                AsIs(usernameTableCreator),
            ),
        )
        connection.commit()

        # Store new credentials in Secrets Manager
        authInfoTableCreator = {"username": usernameTableCreator, "password": passwordTableCreator}
        dbSecret.update(authInfoTableCreator)
        sm_client = boto3.client("secretsmanager")
        sm_client.put_secret_value(
            SecretId=DB_PROXY, SecretString=json.dumps(dbSecret)
        )

        authInfo = {"username": username, "password": password}
        dbSecret.update(authInfo)
        sm_client.put_secret_value(
            SecretId=DB_USER_SECRET_NAME, SecretString=json.dumps(dbSecret)
        )

        # Test query outputs
        sql = """
            SELECT * FROM "Users";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "Patients";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "Enrolments";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "Patient_Files";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "Sessions";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "Messages";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        sql = """
            SELECT * FROM "User_Engagement_Log";
        """
        cursor.execute(sql)
        print(cursor.fetchall())

        # Close cursor and connection
        cursor.close()
        connection.close()

        print("Initialization completed")
    except Exception as e:
        print(e)