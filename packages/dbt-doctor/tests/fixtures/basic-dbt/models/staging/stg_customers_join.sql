select a.*, b.name
from {{ source('raw', 'customers') }} a
inner join {{ source('raw', 'addresses') }} b on a.id = b.customer_id
