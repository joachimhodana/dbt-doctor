select
    id,
    first_name,
    last_name
from {{ source('raw', 'customers') }}
