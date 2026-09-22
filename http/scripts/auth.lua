-- example script: auth.lua
-- Demonstrates dynamic request headers (e.g. rotating tokens or unique request IDs)
-- and inspecting HTTP response status and body in response().

local req_id = 0
local status_200 = 0
local status_other = 0

function request()
    req_id = req_id + 1
    local headers = {}
    headers["Authorization"] = "Bearer token_" .. tostring(req_id)
    headers["X-Request-Id"] = "req-" .. tostring(req_id)
    return wrk.format(nil, nil, headers, nil)
end

function response(status, headers, body)
    if status == 200 then
        status_200 = status_200 + 1
    else
        status_other = status_other + 1
    end
end
