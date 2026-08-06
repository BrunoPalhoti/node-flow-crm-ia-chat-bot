CREATE TABLE IF NOT EXISTS "migrations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" bigint NOT NULL, "name" varchar NOT NULL);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "roles" (
        "id" varchar NOT NULL,
        "name" varchar(50) NOT NULL,
        "description" varchar(255),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      );
CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar NOT NULL,
        "name" varchar(150) NOT NULL,
        "email" varchar(150) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      );
CREATE TABLE IF NOT EXISTS "user_roles" (
        "user_id" varchar NOT NULL,
        "role_id" varchar NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_roles_role"
          FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "chatbot_sessions" (
        "id" varchar NOT NULL,
        "external_session_id" varchar(150) NOT NULL,
        "channel" varchar(30) NOT NULL,
        "status" varchar(30) NOT NULL,
        "started_at" datetime NOT NULL,
        "completed_at" datetime,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_chatbot_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chatbot_sessions_channel_external"
          UNIQUE ("channel", "external_session_id")
      );
CREATE TABLE IF NOT EXISTS "chatbot_messages" (
        "id" varchar NOT NULL,
        "session_id" varchar NOT NULL,
        "sender_type" varchar(20) NOT NULL,
        "message_type" varchar(30) NOT NULL,
        "content" text NOT NULL,
        "external_message_id" varchar(150),
        "sent_at" datetime NOT NULL,
        CONSTRAINT "PK_chatbot_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chatbot_messages_session"
          FOREIGN KEY ("session_id") REFERENCES "chatbot_sessions" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "chatbot_collected_answers" (
        "id" varchar NOT NULL,
        "session_id" varchar NOT NULL,
        "field_name" varchar(100) NOT NULL,
        "question_text" text NOT NULL,
        "answer_value" text NOT NULL,
        "normalized_value" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_chatbot_collected_answers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_chatbot_collected_answers_session_field"
          UNIQUE ("session_id", "field_name"),
        CONSTRAINT "FK_chatbot_collected_answers_session"
          FOREIGN KEY ("session_id") REFERENCES "chatbot_sessions" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "chatbot_webhook_logs" (
        "id" varchar NOT NULL,
        "session_id" varchar,
        "event_type" varchar(50) NOT NULL,
        "correlation_id" varchar(100) NOT NULL,
        "request_payload" text NOT NULL,
        "response_payload" text,
        "status_code" integer,
        "processing_status" varchar(30) NOT NULL,
        "error_message" text,
        "received_at" datetime NOT NULL,
        CONSTRAINT "PK_chatbot_webhook_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chatbot_webhook_logs_session"
          FOREIGN KEY ("session_id") REFERENCES "chatbot_sessions" ("id")
          ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "leads" (
        "id" varchar NOT NULL,
        "chatbot_session_id" varchar,
        "assigned_user_id" varchar,
        "name" varchar(150) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "email" varchar(150),
        "source" varchar(30) NOT NULL,
        "status" varchar(30) NOT NULL,
        "priority" varchar(20) NOT NULL,
        "qualification_score" integer,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_leads" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_leads_chatbot_session_id" UNIQUE ("chatbot_session_id"),
        CONSTRAINT "CHK_leads_qualification_score" CHECK (
          "qualification_score" IS NULL
          OR ("qualification_score" >= 0 AND "qualification_score" <= 100)
        ),
        CONSTRAINT "FK_leads_chatbot_session"
          FOREIGN KEY ("chatbot_session_id") REFERENCES "chatbot_sessions" ("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_leads_assigned_user"
          FOREIGN KEY ("assigned_user_id") REFERENCES "users" ("id")
          ON DELETE SET NULL
      );
CREATE INDEX "IDX_leads_phone" ON "leads" ("phone");
CREATE INDEX "IDX_leads_email" ON "leads" ("email");
CREATE TABLE IF NOT EXISTS "lead_status_history" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "previous_status" varchar(30),
        "new_status" varchar(30) NOT NULL,
        "changed_by_user_id" varchar,
        "reason" text,
        "changed_at" datetime NOT NULL,
        CONSTRAINT "PK_lead_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lead_status_history_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lead_status_history_user"
          FOREIGN KEY ("changed_by_user_id") REFERENCES "users" ("id")
          ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "lead_interactions" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "user_id" varchar,
        "interaction_type" varchar(30) NOT NULL,
        "description" text NOT NULL,
        "interaction_at" datetime NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_lead_interactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lead_interactions_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lead_interactions_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "lead_notes" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "user_id" varchar,
        "content" text NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_lead_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lead_notes_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lead_notes_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "lead_interests" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "desired_vehicle_type" varchar(30),
        "desired_vehicle_style" varchar(50),
        "preferred_brand" varchar(80),
        "minimum_year" integer,
        "minimum_price" decimal(12,2),
        "maximum_price" decimal(12,2),
        "preferred_transmission" varchar(30),
        "preferred_fuel" varchar(30),
        "payment_method" varchar(30),
        "intended_use" varchar(50),
        "customer_description" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_lead_interests" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lead_interests_lead_id" UNIQUE ("lead_id"),
        CONSTRAINT "CHK_lead_interests_prices" CHECK (
          ("minimum_price" IS NULL OR "minimum_price" >= 0)
          AND ("maximum_price" IS NULL OR "maximum_price" >= 0)
          AND (
            "minimum_price" IS NULL
            OR "maximum_price" IS NULL
            OR "minimum_price" <= "maximum_price"
          )
        ),
        CONSTRAINT "FK_lead_interests_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "trade_vehicles" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "has_vehicle" boolean NOT NULL,
        "vehicle_type" varchar(30),
        "brand" varchar(80),
        "model" varchar(100),
        "version" varchar(100),
        "year" integer,
        "mileage" integer,
        "estimated_value" decimal(12,2),
        "is_financed" boolean,
        "remaining_debt" decimal(12,2),
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_trade_vehicles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_trade_vehicles_lead_id" UNIQUE ("lead_id"),
        CONSTRAINT "FK_trade_vehicles_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" varchar NOT NULL,
        "external_code" varchar(80) NOT NULL,
        "vehicle_type" varchar(30) NOT NULL,
        "brand" varchar(80) NOT NULL,
        "model" varchar(100) NOT NULL,
        "version" varchar(100),
        "category" varchar(50),
        "year_manufacture" integer,
        "year_model" integer,
        "price" decimal(12,2) NOT NULL,
        "fuel" varchar(30),
        "transmission" varchar(30),
        "mileage" integer,
        "color" varchar(50),
        "description" text,
        "features" text,
        "image_url" text,
        "status" varchar(30) NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicles_external_code" UNIQUE ("external_code"),
        CONSTRAINT "CHK_vehicles_price" CHECK ("price" >= 0),
        CONSTRAINT "CHK_vehicles_mileage" CHECK (
          "mileage" IS NULL OR "mileage" >= 0
        )
      );
CREATE INDEX "IDX_vehicles_status_category_price_year"
      ON "vehicles" ("status", "category", "price", "year_model")
    ;
CREATE TABLE IF NOT EXISTS "knowledge_documents" (
        "id" varchar NOT NULL,
        "source_type" varchar(40) NOT NULL,
        "source_id" varchar,
        "title" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "metadata" text,
        "content_hash" varchar(64) NOT NULL,
        "version" integer NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        "indexed_at" datetime,
        CONSTRAINT "PK_knowledge_documents" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_documents_source_version"
          UNIQUE ("source_type", "source_id", "version")
      );
CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
        "id" varchar NOT NULL,
        "document_id" varchar NOT NULL,
        "chunk_index" integer NOT NULL,
        "content" text NOT NULL,
        "token_count" integer,
        "metadata" text,
        "content_hash" varchar(64) NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_knowledge_chunks" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_chunks_document_index"
          UNIQUE ("document_id", "chunk_index"),
        CONSTRAINT "FK_knowledge_chunks_document"
          FOREIGN KEY ("document_id") REFERENCES "knowledge_documents" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "knowledge_embeddings" (
        "id" varchar NOT NULL,
        "chunk_id" varchar NOT NULL,
        "embedding" text NOT NULL,
        "model_name" varchar(100) NOT NULL,
        "dimensions" integer NOT NULL,
        "embedding_version" integer NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_knowledge_embeddings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_knowledge_embeddings_chunk_model_version"
          UNIQUE ("chunk_id", "model_name", "embedding_version"),
        CONSTRAINT "FK_knowledge_embeddings_chunk"
          FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "rag_ingestion_jobs" (
        "id" varchar NOT NULL,
        "document_id" varchar NOT NULL,
        "job_type" varchar(30) NOT NULL,
        "status" varchar(20) NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "chunks_created" integer,
        "error_message" text,
        "started_at" datetime,
        "finished_at" datetime,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_rag_ingestion_jobs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rag_ingestion_jobs_document"
          FOREIGN KEY ("document_id") REFERENCES "knowledge_documents" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "rag_search_results" (
        "id" varchar NOT NULL,
        "search_id" varchar NOT NULL,
        "chunk_id" varchar NOT NULL,
        "rank_position" integer NOT NULL,
        "vector_score" decimal(8,6),
        "structured_score" decimal(8,6),
        "final_score" decimal(8,6),
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_rag_search_results" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rag_search_results_search_chunk"
          UNIQUE ("search_id", "chunk_id"),
        CONSTRAINT "UQ_rag_search_results_search_rank"
          UNIQUE ("search_id", "rank_position"),
        CONSTRAINT "FK_rag_search_results_search"
          FOREIGN KEY ("search_id") REFERENCES "rag_searches" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_rag_search_results_chunk"
          FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "analysis_candidates" (
        "id" varchar NOT NULL,
        "analysis_id" varchar NOT NULL,
        "vehicle_id" varchar NOT NULL,
        "position" integer NOT NULL,
        "matching_score" decimal(8,6),
        "matching_reason" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_analysis_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_analysis_candidates_analysis_vehicle"
          UNIQUE ("analysis_id", "vehicle_id"),
        CONSTRAINT "FK_analysis_candidates_analysis"
          FOREIGN KEY ("analysis_id") REFERENCES "lead_ai_analyses" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_analysis_candidates_vehicle"
          FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id")
          ON DELETE CASCADE
      );
CREATE TABLE IF NOT EXISTS "analysis_sources" (
        "id" varchar NOT NULL,
        "analysis_id" varchar NOT NULL,
        "chunk_id" varchar NOT NULL,
        "rag_search_result_id" varchar,
        "citation_order" integer NOT NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_analysis_sources" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_analysis_sources_analysis_chunk"
          UNIQUE ("analysis_id", "chunk_id"),
        CONSTRAINT "FK_analysis_sources_analysis"
          FOREIGN KEY ("analysis_id") REFERENCES "lead_ai_analyses" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_analysis_sources_chunk"
          FOREIGN KEY ("chunk_id") REFERENCES "knowledge_chunks" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_analysis_sources_rag_result"
          FOREIGN KEY ("rag_search_result_id")
          REFERENCES "rag_search_results" ("id") ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
        "id" varchar NOT NULL,
        "analysis_id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "accepted" boolean,
        "useful" boolean,
        "converted" boolean,
        "rating" integer,
        "comment" text,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        "updated_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_recommendation_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_recommendation_feedback_analysis_id"
          UNIQUE ("analysis_id"),
        CONSTRAINT "CHK_recommendation_feedback_rating" CHECK (
          "rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)
        ),
        CONSTRAINT "FK_recommendation_feedback_analysis"
          FOREIGN KEY ("analysis_id") REFERENCES "lead_ai_analyses" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_recommendation_feedback_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE
      );
CREATE INDEX "IDX_chatbot_messages_session_id" ON "chatbot_messages" ("session_id");
CREATE INDEX "IDX_knowledge_chunks_document_id" ON "knowledge_chunks" ("document_id");
CREATE TABLE IF NOT EXISTS "lead_ai_analyses" (
        "id" varchar NOT NULL,
        "lead_id" varchar NOT NULL,
        "rag_search_id" varchar,
        "recommended_vehicle_id" varchar,
        "executive_summary" text,
        "customer_profile" varchar(50),
        "potential_score" integer,
        "recommendation_reason" text,
        "confidence_score" decimal(5,4),
        "next_best_action" varchar(50),
        "strategy" varchar(30),
        "model_name" varchar(100),
        "prompt_version" varchar(50),
        "status" varchar(30) NOT NULL,
        "error_message" text,
        "raw_response" text,
        "processing_time_ms" integer,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_lead_ai_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_lead_ai_analyses_potential_score" CHECK (
          "potential_score" IS NULL
          OR ("potential_score" >= 0 AND "potential_score" <= 100)
        ),
        CONSTRAINT "CHK_lead_ai_analyses_confidence_score" CHECK (
          "confidence_score" IS NULL
          OR ("confidence_score" >= 0 AND "confidence_score" <= 1)
        ),
        CONSTRAINT "FK_lead_ai_analyses_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_lead_ai_analyses_rag_search"
          FOREIGN KEY ("rag_search_id") REFERENCES "rag_searches" ("id")
          ON DELETE SET NULL,
        CONSTRAINT "FK_lead_ai_analyses_vehicle"
          FOREIGN KEY ("recommended_vehicle_id") REFERENCES "vehicles" ("id")
          ON DELETE SET NULL
      );
CREATE TABLE IF NOT EXISTS "rag_searches" (
        "id" varchar NOT NULL,
        "lead_id" varchar,
        "analysis_id" varchar,
        "query_text" text NOT NULL,
        "normalized_query" text,
        "search_strategy" varchar(30) NOT NULL,
        "embedding_model" varchar(100),
        "top_k" integer NOT NULL,
        "filters" text,
        "result_count" integer NOT NULL,
        "processing_time_ms" integer,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "PK_rag_searches" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rag_searches_lead"
          FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL,
        CONSTRAINT "FK_rag_searches_analysis"
          FOREIGN KEY ("analysis_id") REFERENCES "lead_ai_analyses" ("id")
          ON DELETE SET NULL
      );
CREATE INDEX "IDX_rag_searches_lead_id" ON "rag_searches" ("lead_id");
CREATE INDEX "IDX_rag_searches_analysis_id" ON "rag_searches" ("analysis_id");
CREATE INDEX "IDX_lead_ai_analyses_lead_id" ON "lead_ai_analyses" ("lead_id");
CREATE INDEX "IDX_lead_ai_analyses_rag_search_id" ON "lead_ai_analyses" ("rag_search_id");
