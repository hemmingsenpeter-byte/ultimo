# Ultimo v0.5 — Tutoring architecture

Six roles: faculty professor, Socratic tutor, formative examiner, practical coach, research librarian and academic dean. Each can operate on any authored lesson. The public static site provides deterministic curriculum retrieval, practice questions with self-check, and a grounded prompt export. It is not a generative chatbot until a model gateway is configured.

## Grounding and privacy
The selected lesson is the context boundary. Its approved-for-authoring-but-not-reviewed draft sections, questions, outcomes, rubric and registered references are assembled from canonical curriculum.json. No external browsing or tools; no student portfolio, local quiz records or other profile information are included in model prompts. Prompts require explicit consent per request. Tutor history stays in memory and is limited to six recent turns. Exported prompts include only the current question and public lesson material; do not enter sensitive information. External providers have their own retention and privacy policies.

The model must distinguish draft evidence from established facts, cite exact lesson passage IDs, acknowledge uncertainty, avoid clinical or regulated personal advice and never grant mastery. Citation checking only validates whether mentioned IDs occur in the supplied context; it does not verify entailment or truth. Prompt rules are not a complete security/safety guarantee. Practice scores are formative self-checks; no automatic grading or verified competency.

## Local model gateway (optional, single user)
Build from the repo root:

    python3 tools/build.py

For Ollama, run a local Ollama server with an installed chat model. Then:

    export ULTIMO_PROVIDER=ollama
    export ULTIMO_MODEL=YOUR_INSTALLED_MODEL
    python3 tools/tutor_server.py

For OpenAI, set an API key securely in your shell/environment, never commit it:

    export ULTIMO_PROVIDER=openai
    export ULTIMO_MODEL=YOUR_SUPPORTED_CHAT_MODEL
    python3 tools/tutor_server.py

Open http://127.0.0.1:8000/#tutor (not localhost). The gateway listens only on loopback and uses same-origin requests, host/origin checks, a random per-process token, input/output limits and a six-per-minute limit. Credentials stay server side. OpenAI use can incur API charges. Ollama is local if a local model is selected; do not use cloud-connected model names for private workloads. See provider docs: https://docs.ollama.com/api/chat and https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create.

Do not expose the gateway via a public host, reverse proxy or tunnel. It is not production authentication or a multi-user service. The static Render site cannot run this Python service. A future hosted inference service requires user authentication, consent/retention policies, per-user and global spend quotas, HTTPS, rate limiting, provider-specific evaluation and deployment approval.

## Personalised study recommendations
Prioritise due reviews, low formative quiz scores, then next unread lessons whose course prerequisites are marked read. Use weekly study hours as a bounded planning budget; no diagnosis or ability profile is inferred. The queue is a transparent deterministic recommendation, not an AI prediction.

## Evaluation
Run Python unit tests and Node tutor/state tests. They check context isolation, role routing, valid reference IDs, consent, input limits, practice sequencing and study budget. These are structural tests only. Before exposing a generative tutor online, run adversarial prompt-injection, hallucination, safety, citation entailment, learner privacy and educational quality evaluations against the configured model; get qualified review of sensitive topics. No provider credentials or actual model inference were required for the structural tests.
