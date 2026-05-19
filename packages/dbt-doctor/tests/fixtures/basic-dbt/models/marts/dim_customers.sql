select
    id,
    first_name,
    last_name
from {{ ref('stg_customers') }}
