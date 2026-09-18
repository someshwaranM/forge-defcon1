"""
Index names shared across routers and pipeline stages.

Claims live in two indices:
  insurance-claims  claims entered manually or seeded as sample data
  claim-files       claims created by uploading documents (DRAFT first)
Reads that look a claim up by claim_id search both (ALL_CLAIMS).
"""
INSURANCE_CLAIMS = "insurance-claims"
CLAIM_FILES = "claim-files"
CLAIM_DOCUMENTS = "claim-documents"

ALL_CLAIMS = f"{CLAIM_FILES},{INSURANCE_CLAIMS}"
