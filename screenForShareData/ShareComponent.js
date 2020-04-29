import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  FlatList
} from "react-native";
import * as React from "react";
import AntDesign from "react-native-vector-icons/AntDesign";
import { sizeFont, color } from "config/styles";
import InputText from "../gui/InputText";
import {ClearTextIcon} from "../gui/clearTextIcon";
import { ScrollView } from "react-native-gesture-handler";
import { colors } from "react-native-elements";
import { ROLES } from "../../utils/RoleUtils";
import { isListAndNotEmpty } from "../../utils/arrayUtils";
import { isEmail } from "../../utils/stringUtils";
import { ButtonGroup, SearchBar, Icon } from "react-native-elements";
import { Paragraph, Menu, Divider, Provider, Chip } from 'react-native-paper';

export const ShareComponent = (props) => {

  const [searchText, setSearchText] = React.useState("");
  const [lastSharedUser, setLastSharedUser] = React.useState("");
  const [pickedRole, setPickedRole] = React.useState(ROLES.viewer);
  const [isDropdownVisible, setDropdownVisible] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(1);
  const alreadySharedUsers = props.alreadySharedUsers;

  const alreadySharedEmails = props.userList || [];

  const renderItem = ({ item, index }) => {
    return (
      <Chip
        style={styles.sharedUser}
        mode="outlined"
        onClose={() => {
          props.unSharePlan(item);
        }}
      >
        {item}
      </Chip>
    );
  };

  const checkAndReloadShareStatus = () => {
    if(props.isSuccShare) {
      props.reloadShareStatus();
    }
  };

  const updateIndex = index => {
    const newPickedRole = index === 0 ? ROLES.editor : ROLES.viewer;
    setSelectedIndex(index);
    setPickedRole(newPickedRole);
  };

  const isEmailEntered = isEmail(searchText);
  const isAlreadyShared = alreadySharedUsers.includes(searchText);
  const buttons = ["editor", "viewer"];
  return (
    <Provider>
      <View style={styles.container}>
        <View style={styles.bodyContainer}>
          <View style={styles.topBlock}>
          <ButtonGroup
            onPress={updateIndex}
            selectedIndex={selectedIndex}
            buttons={buttons}
            containerStyle={styles.switchContainer} 
            buttonStyle={styles.switchButtonStyle}
            selectedButtonStyle={styles.selectedButtonStyle}
            textStyle={styles.buttonTextStyle}
            selectedTextStyle={styles.selectedTextStyle}
            />
            <SearchBar
              placeholder="E-Mail"
              round
              lightTheme
              style={styles.searchBar}
              inputStyle={styles.searchBarInput}
              containerStyle={styles.searchContainer}
              inputContainerStyle={styles.searchBarInputContainer}
              searchIcon={
                <Menu
                  style={styles.dropdown}
                  visible={isDropdownVisible}
                  onDismiss={() => {
                    setDropdownVisible(false);
                  }}
                  anchor={
                    <Icon
                      name="chevron-thin-down"
                      type="entypo"
                      color={color.primary()}
                      containerStyle={styles.iconStyle}
                      onPress={() => {
                        setDropdownVisible(!isDropdownVisible);
                      }}
                      size={17}
                    />
                  }
                >
                  <ScrollView style={styles.menuScroll}>
                    {alreadySharedEmails.map((email) => (
                      <Menu.Item onPress={() => {
                          setSearchText(email);
                          setDropdownVisible(!isDropdownVisible);
                        }}
                        title={email}
                      />
                    )
                    )}
                  </ScrollView>
                </Menu>
              }
              onChangeText={text =>{
                setDropdownVisible(false);
                setSearchText(text);
                checkAndReloadShareStatus();
              }}
              value={searchText}
            />
            <TouchableOpacity
              activeOpacity={isEmailEntered && !props.isSuccShare && !isAlreadyShared ? 0.2 : 1}
              onPress={() => {
                if(isEmailEntered && !props.isSuccShare && !isAlreadyShared){
                  props.sharePlan(searchText, pickedRole);
                  setLastSharedUser(searchText);
                }
              }}
            >
              <View
                style={isEmailEntered ? styles.submit : [styles.submit, styles.inactive]}
              >
                { props.isSuccShare || isAlreadyShared
                  ? <AntDesign
                    size={18}
                    name="check"
                    color={color.white()}
                  />
                  : <Text style={isEmailEntered ? styles.submitText : [styles.submitText, styles.inactiveText]}>teilen</Text>
                }
              </View>
            </TouchableOpacity>
            { props.isSuccShare && 
              (
                <View
                  style={styles.successMessage}
                >
                  <Text
                    style={
                      styles.successMessageText
                    }
                  >
                    Sie haben einen Plan erfolgreich mit {lastSharedUser} geteilt
                  </Text> 
                </View>
              )
            }
          </View>
          { isListAndNotEmpty(alreadySharedUsers) ?
            <View style={styles.sharedWithContainer}>
              <Text style={styles.sharedUsersListHeader}>Geteilt mit:</Text>
              <ScrollView contentContainerStyle={styles.sharedUsersScroll}>
                <FlatList
                  contentContainerStyle={styles.sharedListContainer}
                  data={alreadySharedUsers}
                  renderItem={renderItem}
                  numColumns={3}
                />
              </ScrollView>
            </View> : <View style={{height: 120}}/>
          }
        </View>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    height: "80%",
    width: "100%",
    justifyContent: "space-between" 
  },
  topBlock: {
    alignItems: "center"
  },
  submit: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: color.primary(),
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    marginTop: 25,
    width: 130,
    height: 50
  },
  iconStyle: {
    marginLeft: 10
  },
  dropdown: {
    marginTop: -30
  },
  menuScroll: {
    height: 110
  },
  inactive: {
    backgroundColor: colors.grey5
  },
  submitText: {
    color: color.white(),
    fontSize: sizeFont.MEDIUM,
  },
  inactiveText: {
    color: colors.grey3,
  },
  bodyContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 25
  },
  switchContainer: {
    height: 30,
    width: 310
  },
  switchButtonStyle: {
    backgroundColor: colors.grey4
  },
  selectedButtonStyle: {
    backgroundColor: color.white()
  },
  buttonTextStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    color: color.primary()
  },
  searchBar: {
    borderTopWidth: 0
  },
  searchBarInput: {
    color: color.black()
  },
  searchContainer: {
    borderWidth: 0,
    backgroundColor: color.white(),
    width: 512,
    marginTop: 40,
    borderTopWidth: 0,
    borderBottomWidth: 0
  },
  searchBarInputContainer: {
    backgroundColor: colors.grey5,
    borderRadius: 40
  },
  sharedWithContainer: {
    height: 100,
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    width: 700
  },
  sharedUsersListHeader: {
    marginTop: 6
  },
  sharedListContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: 20
  },
  sharedUser: {
    marginRight: 5,
    marginBottom: 5
  },
  sharedUsersScroll: {
    height: 95
  },
  successMessage: {
    backgroundColor: color.primary(0.2),
    borderLeftWidth: 4,
    borderLeftColor: color.primary(),
    width: "75%",
    paddingVertical: 1,
    marginTop: 30
  },
  successMessageText: {
    color: color.primary(),
    marginLeft: 10,
    marginRight: 10
  }
});
