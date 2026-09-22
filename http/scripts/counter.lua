-- example script: counter.lua
-- Demonstrates dynamic request generation where each request gets an incrementing ID.

local counter = 0

function request()
    counter = counter + 1
    local path = "/items?id=" .. counter .. "&session=test"
    return wrk.format(nil, path)
end
