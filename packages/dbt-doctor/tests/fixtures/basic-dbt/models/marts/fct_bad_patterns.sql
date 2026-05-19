{{ config(materialized='table') }}

select *
from {{ source('raw', 'orders') }}
join {{ ref('stg_customers') }} using (customer_id)
