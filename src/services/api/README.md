Centralize all backend requests in this directory. Components and views should consume domain services instead of importing Axios directly.

Expected service boundaries:
- auth.service.js
- access.service.js
- catalog.service.js
- ocr.service.js
