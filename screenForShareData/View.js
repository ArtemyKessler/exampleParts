/* eslint-disable react/no-string-refs */
import React from "react";
import { View, StyleSheet, ScrollView, BackHandler, Text, Alert } from "react-native";
import { color, sizeFont, font } from "../../config/styles";
import { ShareComponent } from "components/shareModalComponents/shareComponent.js";
import { ActivityIndicator } from "react-native";
import { getRecoursiveFilteredStringArray } from "../../utils/stringUtils";



export const SharePlanView = (props) => {
  const errorList = getRecoursiveFilteredStringArray(props.error);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => { 
      this.props.navigation.goBack();
      return true;
    });

    return backHandler.remove();
  }, []);


  const goBack = () => {
    props.navigation.goBack();
  }

  const sharePlan = (searchText, pickedRole) => {
    Alert.alert(
      `Share '${props.title}' with ${searchText}?`, 
      "Are you sure?",
      [
        {
          text: "SHARE",
          onPress: () => {
            props.sharePlan(searchText, pickedRole);
          }
        },
        {
          text: "CANCEL",
          style: "cancel"
        }
      ],
      { cancelable: false }
    );
  }

  const unSharePlan = (user) => {
    Alert.alert(
      `Unshare plan with ${user}?`, 
      "Are you sure?",
      [
        {
          text: "UNSHARE",
          onPress: () => {
            props.unSharePlan(user);
          }
        },
        {
          text: "CANCEL",
          style: "cancel"
        }
      ],
      { cancelable: false }
    );
  }


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {
        props.loading && <View style={styles.preloader}>
          <ActivityIndicator size={100} color={color.primary}/>
        </View>
      }
      <Text style={styles.header}>Projektplan Teilen</Text>
      <ShareComponent 
        closeModal={goBack} 
        sharePlan={sharePlan} 
        unSharePlan={unSharePlan} 
        alreadySharedUsers={props.localSharedUsers}
        isSuccShare={props.isSuccShare}
        reloadShareStatus={props.reloadShareStatus}
        userList={props.userList}
      />
      <View style={errorList.length > 0 ? styles.errors : {}}>
        {errorList.length > 0
          ? errorList.map((msg, key) => {
            return <Text key={key} style={styles.oneError}>{msg}</Text>;
          })
          : false}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.white()
  },
  header: {
    color: color.textColor(),
    marginLeft: "auto",
    marginRight: "auto",
    fontSize: sizeFont.LARGE,
    fontFamily: font.FONT_LIGHT
  },
  preloader: {
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    justifyContent: "center", 
    alignItems: "center",
    zIndex: 5
  },
  errors: {
    justifyContent: "center",
    alignItems: "center"
  },
  oneError: {
    color: "red"
  }
});

export default SharePlanView;
