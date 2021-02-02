import axios from "axios";

import { API_ENDPOINT } from "../Constants";
import { getItem, getPluginUuid } from "../managers/LocalManager";

import { getPluginId, getVersion, getOs, getOffsetSeconds, getPluginName } from "../managers/UtilManager";

// build the axios api base url
const beApi = axios.create({
  baseURL: API_ENDPOINT,
  timeout: 60000,
});

beApi.defaults.headers.common["X-SWDC-Plugin-Id"] = getPluginId();
beApi.defaults.headers.common["X-SWDC-Plugin-Name"] = getPluginName();
beApi.defaults.headers.common["X-SWDC-Plugin-Version"] = getVersion();
beApi.defaults.headers.common["X-SWDC-Plugin-OS"] = getOs();
beApi.defaults.headers.common["X-SWDC-Plugin-TZ"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
beApi.defaults.headers.common["X-SWDC-Plugin-Offset"] = getOffsetSeconds() / 60;
beApi.defaults.headers.common["X-SWDC-Plugin-UUID"] = getPluginUuid();

/**
 * Response returns a paylod with the following...
 * data: <payload>, status: 200, statusText: "OK", config: Object
 * @param api
 * @param jwt
 */

export async function softwareGet(api, overriding_token: string = null) {
  const jwt: string = getItem("jwt");
  if (jwt && !overriding_token) {
    beApi.defaults.headers.common["Authorization"] = jwt;
  } else if (overriding_token) {
    beApi.defaults.headers.common["Authorization"] = overriding_token;
  }

  return await beApi.get(api).catch((err) => {
    console.error(`error fetching data for ${api}, message: ${err.message}`);
    return err;
  });
}

/**
 * perform a put request
 */
export async function softwarePut(api, payload) {
  const jwt: string = getItem("jwt");
  if (jwt) {
    beApi.defaults.headers.common["Authorization"] = jwt;
  }

  return await beApi
    .put(api, payload)
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      console.error(`error posting data for ${api}, message: ${err.message}`);
      return err;
    });
}

/**
 * perform a post request
 */
export async function softwarePost(api, payload) {
  const jwt: string = getItem("jwt");
  if (jwt) {
    beApi.defaults.headers.common["Authorization"] = jwt;
  }
  return beApi
    .post(api, payload)
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      console.error(`error posting data for ${api}, message: ${err.message}`);
      return err;
    });
}

/**
 * perform a delete request
 */
export async function softwareDelete(api) {
  const jwt: string = getItem("jwt");
  if (jwt) {
    beApi.defaults.headers.common["Authorization"] = jwt;
  }
  return beApi
    .delete(api)
    .then((resp) => {
      return resp;
    })
    .catch((err) => {
      console.error(`error with delete request for ${api}, message: ${err.message}`);
      return err;
    });
}

/**
 * check if the reponse is ok or not
 * axios always sends the following
 * status:200
 * statusText:"OK"
 */
export function isResponseOk(resp) {
  let status = getResponseStatus(resp);
  if (status && resp && status < 300) {
    return true;
  }
  return false;
}

/**
 * get the response http status code
 * axios always sends the following
 * status:200
 * statusText:"OK"
 */
function getResponseStatus(resp) {
  let status = null;
  if (resp && resp.status) {
    status = resp.status;
  } else if (resp && resp.response && resp.response.status) {
    status = resp.response.status;
  } else if (resp && resp.code && resp.code === "ECONNABORTED") {
    status = 500;
  }
  return status;
}
