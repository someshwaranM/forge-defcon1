# Submission

Fill this in as you build. It is the first thing judges read.

## Team

- Team name: defcon1
- Project name: MediAudit-X
- Members: Surya,Aman,Devanshu,Chirag,Ansh

## Problem

What problem are you solving, and who is it for?

Answer - 
Health insurance claims adjudication today is slow and opaque for everyone involved. Hospital staff submit claims as raw paperwork — bills, discharge summaries, lab reports — and have no visibility into why a claim stalls or gets denied. Insurance reviewers, on the other end, have to manually transcribe that paperwork into structured data before they can even start checking it against payer policy, patient history, and drug safety, then make a judgment call with no easy way to show their reasoning later. MediAudit-X is built to make that process easier for both sides of the same claim, not just one.

For hospital staff, it automatically translates raw medical documents into insurance-ready JSON — classifying each document, extracting the relevant fields, and normalizing diagnoses and procedures into real ICD-10/CPT codes — so a claim is ready for review in seconds instead of requiring manual re-keying, with built-in checks that catch mismatched dates, bill errors, and missing documents before submission.

For insurance reviewers, it takes that structured claim and does the cross-checking a human would otherwise do by hand: matching it against payer policy, verifying the patient's treatment history, and screening for drug interactions, then surfacing a recommendation backed by cited evidence and a tamper-evident audit trail — so the reviewer can approve, deny, or override quickly and with confidence, rather than starting from a blank page. The AI's role stays advisory throughout; the reviewer always makes the final call.

Together, it turns a slow, opaque, document-heavy process into one that's fast and transparent on both ends — quicker claim submission for hospitals, faster and better-justified decisions for reviewers, and ultimately quicker resolution for patients.

## Solution

What did you build? How does a user go from question to answer?

Answer -
We built MediAudit-X, a claims intake and adjudication platform on Elasticsearch, with two connected halves that meet at one shared claim record.

On the hospital side, a staff member uploads raw documents (a bill, discharge summary, lab report) or pastes a TPA's JSON export. The system classifies each document, extracts the relevant fields with a confidence score and a pointer back to the exact page/excerpt it came from, normalizes diagnoses and procedures into real ICD-10/CPT codes through a terminology lookup, and runs validation checks (mismatched dates, bill total errors, duplicate line items, missing documents) — turning raw paperwork into one canonical, structured claim in seconds instead of manual re-keying. That's the hospital's "question" — "is this claim ready to submit, and is anything wrong with it?" — answered immediately in the intake screen, with any findings shown inline rather than discovered later.

On the insurance side, a reviewer's question is "should this claim be approved?" They open the claim from the review queue and trigger adjudication, which streams live as the agent works rather than making them wait on a single blocking call: it matches the claim against payer policy using a hybrid BM25 + vector search over the policy index, checks the patient's real treatment history with an ES|QL query (for example, whether a step-therapy requirement was actually met), and screens for drug-drug interactions against an FDA interaction index. Each of those checks streams back as a reasoning step the reviewer can watch happen, and the run ends with a recommendation, a generated decision letter, and every cited fact linked to its real source document — never a bare "approve" or "deny" with no trail. The reviewer then makes the actual call (approve, deny, or request more info) themselves; the AI's recommendation is advisory only. That decision, along with the AI's own recommendation if one was made, is written to a hash-chained audit ledger, so the answer to "why was this claim decided this way" stays verifiable and tamper-evident even if it's questioned months later — a claim's full decision history can be replayed and the chain re-verified end to end.

So concretely: raw documents in → structured, validated claim out (hospital side); a claim in → a cited, streamed, human-signed-off decision with a permanent audit trail out (insurance side). Both paths turn what used to be manual, opaque work into a fast answer with the reasoning attached.


## Architecture

What services and data stores are in the path? Note Elastic, AWS, and Sarvam usage.

Answer: 

Elastic

Elasticsearch is the system of record — 12 indices spanning claims, clinical EHR data, medical policies, drug interactions, the audit ledger, and claim-intake artifacts (documents, evidence, findings). Retrieval uses hybrid search: RRF combining BM25 multi_match with knn vector search over policy and clinical-note embeddings, plus custom analyzers (medical_code_analyzer, rxnorm_analyzer) for exact CPT/ICD-10/RxNorm matching. ES|QL powers temporal queries like conservative-therapy trajectory duration. Painless scripts handle server-side mutations via update_by_query.

Elastic Agent Builder (via Kibana's REST API) drives the AI chat inside each claim — three custom ES|QL tools (patient history, policy search, drug-interaction search) plus one agent, mediaudit-claim-assistant, with automatic fallback to a Bedrock-based tool loop if Agent Builder is unavailable.

Elasticsearch and Kibana also power application logging — a custom log handler ships structured JSON log records to an app-logs index in the background, with request/claim context propagated across the pipeline, giving full observability into every adjudication run alongside the audit trail.

AWS

Bedrock runs the core LLM (Claude Sonnet 4.5) for document classification, field extraction, and the multi-step adjudication agent's reasoning loop.
S3 is the document store for all raw uploads (bills, discharge summaries, lab reports) — durable, versioned storage that the intake pipeline references by document ID, with those same IDs threaded through as provenance on every extracted field.
Textract performs OCR on scanned/image-based documents, feeding extracted text into the classification and field-extraction stages so the pipeline handles both digital-native PDFs and scanned paperwork end to end.

Sarvam

Not used in this build. Planned as a future feature: patient-facing decision letters translated into the patient's own language, and a multilingual AI chat assistant — both using Sarvam's translation/chat APIs to make the claim-decision and chat experience accessible beyond English.

## Demo

- Live URL or recording: 
http://187.77.130.9:3000/login


- How to run locally: 
Run these commands - 
cd src/mediaudit-x
cp backend/.env.example backend/.env  
Provide the AWS API key and Elastic search URL and API Key  
docker compose up --build    

UI at localhost:3000, API docs at localhost:8000/docs. Indices are created automatically and sample data seeds on first run.

PPT Link : https://drive.google.com/drive/folders/1KuTvbEzow0dXEj7HojtyA5sAKwcKO2RC?usp=sharing


- Sample queries or prompts: 
1. Login using the demo user name and password at the login screen
2. To submit a sample claim - upload file from InputFile folder to file a new claim
3. Open a claim
4. Run adjudication to run the agent orchestration 
5. Open AI Assitance to chat and get more info about the claim



## What we used

Elastic
System of record: Elasticsearch, 12 indices covering claims, clinical EHR data, medical policies, drug interactions, the audit ledger, and claim-intake artifacts. Hybrid search (RRF: BM25 + knn vector search), custom analyzers for exact CPT/ICD-10/RxNorm matching, ES|QL for trajectory queries, Painless for server-side mutations. Elastic Agent Builder (via Kibana) powers the in-claim AI chat, with a Bedrock fallback. Elasticsearch/Kibana also ship structured logs to an app-logs index for observability.

AWS
Bedrock (Claude Sonnet 4.5) for document classification, field extraction, and the adjudication agent's reasoning. S3 for document storage. Textract for OCR.

Sarvam
Not used yet — planned for future work: multilingual decision letters and a multilingual AI chat assistant.

Other
Next.js frontend, FastAPI backend, SHA-256 hash-chained audit ledger.

## What we would do next

What would you add with more time?

Sarvam-powered multilingual experience. Decision letters and the AI chat assistant available in the patient's own language, extending the platform beyond English-only.

Direct EHR/HIS ingestion. Instead of manual document upload, a connector that pulls discharge summaries and bills straight from a hospital's EHR system into the intake pipeline, using the existing HospitalDocumentAdapter path.