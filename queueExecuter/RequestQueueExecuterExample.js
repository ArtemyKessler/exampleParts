import { DeviceEventEmitter } from "react-native";
import axios from "axios";
import dayjs from "dayjs";

import { store } from "../store/configureStore";
import { isListAndNotEmpty } from "../utils/arrayUtils";
import { api } from "../api";
import { removeRequestFromQueue, addRequestToQueue } from "../redux/modules/Queue";
import { setToken } from "../redux/modules/Token";
import { Network } from "./NetworkChecker";

const EXEC_START = "EXECUTER_START";
const EXEC_NO_INTERNET = "Keine Internetverbindung";
const EXEC_TOKEN_REFRESH_FAIL = "TOKEN_REFRESH_FAILED";
const EXEC_STATUS_OK = "RESPONSE_STATUS_SUCCESS";
const EXEC_STATUS_FAIL = "RESPONSE_STATUS_FAILURE";
export const ExecuterConsts = { EXEC_NO_INTERNET, EXEC_STATUS_OK, EXEC_STATUS_FAIL, EXEC_TOKEN_REFRESH_FAIL, EXEC_START };

let emitterSub = null;

const init = () => {
  emitterSub = DeviceEventEmitter.addListener(EXEC_START, executeQueue);
  Network.subscribeToNetworkStateChange();
}
const finish = () => {
  emitterSub.remove();
}
const addRequestAndExecute = async config => {
  const netWorkOnline = await Network.isOnline();
  if (!netWorkOnline && config.onlineOnly) {
    DeviceEventEmitter.emit(config.caller, wrapResponse(config, { message: EXEC_NO_INTERNET }));
  } else {
    store.dispatch(addRequestToQueue(config));
    DeviceEventEmitter.emit(EXEC_START);
  }
}
export const ExecuterActions = { init, finish, addRequestAndExecute };

const executeQueue = async () => {
  const netWorkOnline = await Network.isOnline();
  if (netWorkOnline) {
    const requests = store.getState().queue.requestList;
    if (isListAndNotEmpty(requests)) {
      prepareToExecute(requests[0]);
    }
  }
}

const prepareToExecute = (request) => {
  if (request.tokenNeed) {
    getFreshToken().then(token => {
      executeRequest(request, token)
    }).catch(() => tokenFetchFailed())
  } else executeRequest(request, null)
}

const executeRequest = (request, token) => {
  const axiosConfig = prepareConfig(request, token)
  axios.request(axiosConfig).then(response => { sendAnswer(request, response) }).catch(e => { sendAnswer(request, e) });
}

const prepareConfig = (config, token) => ({
  url: config.subjectUrl,
  method: config.method,
  baseURL: config.baseUrl,
  headers: {
    Authorization: token,
    "Content-Type": config.contentType,
    Accept: "application/json"
  },
  data: config.data,
});

const sendAnswer = (request, answer) => {
  DeviceEventEmitter.emit(request.caller, wrapResponse(request, answer));
  store.dispatch(removeRequestFromQueue(request));
  setTimeout(() => {
    executeQueue();
  }, 100);
};

const wrapResponse = (request, response) => ({
  status: response.status && response.status === 200 ? EXEC_STATUS_OK : EXEC_STATUS_FAIL,
  info: {
    data: response.response ? response.response.data : response.data ? response.data : response,
    request: request
  }
});

const tokenIsFresh = (tokenTime) => !dayjs().isAfter(dayjs(tokenTime));

const getFreshToken = async () => {
  const token = store.getState().token.currentToken;
  const tokenTime = store.getState().token.tokenLifeTime;

  if (!tokenIsFresh(tokenTime)) {
    const updateTokenConfig = prepareConfig(api.token.configForRefresh(), token);
    try {
      const freshTokenInfo = await axios.request(updateTokenConfig);
      const newTokenData = freshTokenInfo.data;
      store.dispatch(setToken(newTokenData))
      return freshTokenInfo.data.token;
    } catch (e) {
      return await anotherWayToGetToken();
    }
  } else {
    return token;
  }
}

const anotherWayToGetToken = async () => {
  const email = store.getState().user.email;
  const pass = store.getState().user.password;
  const anotherTokenConfig = prepareConfig(api.user.login({ email: email, password: pass }));
  try {
    const response = await axios.request(anotherTokenConfig);
    store.dispatch(setToken(response.data));
    return response.data.token;
  } catch (e) { tokenFetchFailed() }
}
const tokenFetchFailed = () => DeviceEventEmitter.emit("global?", { status: EXEC_STATUS_FAIL, message: EXEC_TOKEN_REFRESH_FAIL });
