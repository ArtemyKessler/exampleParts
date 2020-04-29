import React from "react";
import SharePlanView from "./SharePlanView";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../api";
import { DeviceEventEmitter } from "react-native";
import { ExecuterConsts, ExecuterActions } from "../../networking/QueueExecuter";
import { editPlan } from "../../redux/modules/Plans";
import { addToShareHistory } from "../../redux/modules/User";
import { isListAndNotEmpty } from "../../utils/arrayUtils"

const CALLER = "SHARE_PLAN";
let sharedUsersToConfirm = [];
let latestSharedEmail = "";


const SharePlanContainer = (props) => {
  
  const dataOfPlan = props.navigation.getParam("dataOfPlan");
  const sharedProjects = isListAndNotEmpty(dataOfPlan.shared_projects) ? dataOfPlan.shared_projects : [];

  const user = useSelector( state => state.user );
  const userList = user.shared_history;
  const dispatch = useDispatch();
  const [ error, setError ] = React.useState([]);
  const [ loading, setLoading ] = React.useState(false);
  const [ localSharedUsers, setLocalSharedUsers ] = React.useState(dataOfPlan.sharedUsers || []);
  const [ isSuccShare, setIsSuccShare ] = React.useState(false);

  const handleShareFailure = (reason) => {
    setLocalSharedUsers(sharedProjects.map(item => item.user.email));
    setError(reason.data);
    setIsSuccShare(false);
    alert("Teilen Erfolglos");
  }

  const handleShareSuccess = (info) => {
    setLocalSharedUsers(sharedUsersToConfirm);
    const newPlan = dataOfPlan;
    newPlan.sharedUsers = sharedUsersToConfirm;
    dispatch(editPlan(dataOfPlan.project_id, newPlan));
    if(!userList.includes(latestSharedEmail))
      dispatch(addToShareHistory(latestSharedEmail));
    setIsSuccShare(true);
  }

  const handleUnShareFailure = (reason) => {
    setLocalSharedUsers(sharedProjects.map(item => item.user.email));
    setError(reason.data);
    setIsSuccShare(false);
  }

  const handleUnShareSuccess = (info) => {
    setLocalSharedUsers(sharedUsersToConfirm);
    const newPlan = dataOfPlan;
    newPlan.sharedUsers = sharedUsersToConfirm;
    dispatch(editPlan(dataOfPlan.projectId, newPlan));
  }

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(CALLER, (e) => {
      setLoading(false);
      switch (e.info.request.callerType) {
        case api.ACTIONS.PLANS.share : {
          e.status === ExecuterConsts.EXEC_STATUS_OK ? handleShareSuccess(e.info) : handleShareFailure(e.info);
        } break;
        case api.ACTIONS.PLANS.unShare : {
          e.status === ExecuterConsts.EXEC_STATUS_OK ? handleUnShareSuccess(e.info) : handleUnShareFailure(e.info);
        } break;
        default: break;
      }
    })
    return () => {
      subscription.remove();
    }
  }, []);

  const sharePlan = (sharedUserEmail, pickedRole) => {
    let newUsers = isListAndNotEmpty(localSharedUsers) ? localSharedUsers : [];
    if(!newUsers.includes(sharedUserEmail))
    {
      newUsers.push(sharedUserEmail);
      sharedUsersToConfirm = newUsers;
      latestSharedEmail = sharedUserEmail;
      setLoading(true);
      setError([]);
      const shareConfig = api.plans.sharePlan(dataOfPlan.id, sharedUserEmail, pickedRole);
      shareConfig.caller = CALLER;
      ExecuterActions.addRequestAndExecute(shareConfig);
    } else {
      setError("Sie haben bereits mit diesem Benutzer geteilt");
    }
  }

  const unSharePlan = (sharedUser) => {
    sharedUsersToConfirm = localSharedUsers.filter((user) => sharedUser !== user);
    setLoading(true);
    setError([]);
    const shareConfig = api.plans.unSharePlan(dataOfPlan.id, sharedUser);
    shareConfig.caller = CALLER;
    ExecuterActions.addRequestAndExecute(shareConfig);
  }

  const reloadShareStatus = () => {
    setIsSuccShare(false);
  }

  return <SharePlanView 
    {...props} 
    title={dataOfPlan.title} 
    localSharedUsers={localSharedUsers}
    sharePlan={sharePlan} 
    unSharePlan={unSharePlan}
    error={error} 
    loading={loading}
    isSuccShare={isSuccShare}
    reloadShareStatus={reloadShareStatus}
    userList={userList}
  />;
}

export default SharePlanContainer;
