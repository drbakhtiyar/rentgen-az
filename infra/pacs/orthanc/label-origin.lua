-- rentgen.az PACS — stamp every incoming study with the label of the clinic
-- gateway that sent it. Gateways authenticate to the REST API as "gw-<centerId>"
-- (Orthanc RegisteredUsers) → label "center-<centerId>". rentgen.az scopes
-- center sessions to exactly these labels (see infra/pacs/auth/server.mjs).
-- Labels may only contain [A-Za-z0-9_-].
function OnStoredInstance(instanceId, tags, metadata, origin)
  if origin == nil then return end
  local user = origin['Username']
  if origin['RequestOrigin'] ~= 'RestApi' or user == nil then return end
  local centerId = string.match(user, '^gw%-([%w_%-]+)$')
  if centerId == nil then return end
  local inst = ParseJson(RestApiGet('/instances/' .. instanceId))
  if inst == nil or inst['ParentSeries'] == nil then return end
  local series = ParseJson(RestApiGet('/series/' .. inst['ParentSeries']))
  if series == nil or series['ParentStudy'] == nil then return end
  RestApiPut('/studies/' .. series['ParentStudy'] .. '/labels/center-' .. centerId, '')
end
