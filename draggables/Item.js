/* eslint-disable no-extra-boolean-cast */
import * as React from "react";
import { View, PanResponder, Image, InteractionManager, StyleSheet } from "react-native";
import { color, markerSize } from "config/styles"; 

const LONG_PRESS_TIMEOUT = 600;

class Draggable extends React.PureComponent {
  constructor(props) {
    super(props);

    this._isScalable = props.scalable !== undefined ? props.scalable : false;
    this._clickable = props.clickable !== undefined ? props.clickable : false;

    this._child = props.child !== undefined ? props.child : false;

    this.onChange =
      props.onChange !== undefined
        ? props.onChange
        : () => {
          console.log(
            "Draggable Constructor -> OnChange method is not defined"
          );
        };
    this.onPress =
      props.onPress !== undefined
        ? props.onPress
        : () => {
          if (this._clickable)
            console.log(
              "Draggable Constructor -> onPress method is not defined"
            );
        };
    this.onLongPress =
      props.onLongPress !== undefined
        ? props.onLongPress
        : () => {
          if (this._clickable)
            console.log(
              "Draggable Constructor -> onLongPress method is not defined"
            );
        };

    // position shift
    this._shiftPositionX =
      props.positionShift !== undefined ? props.positionShift.x : 0;
    this._shiftPositionY =
      props.positionShift !== undefined ? props.positionShift.y : 0;

    // scale of parent to be multiplied with gesture.deltaXY
    this._scale = props.parentScale !== undefined ? props.parentScale : 1;

    // position without shift
    this._currentPosition = {
      x: !!props.posX ? props.posX : 0,
      y: !!props.posY ? props.posY : 0
    }

    this._parentCenter = {
      x: props.parentCenterPoint.x,
      y: props.parentCenterPoint.y
    };

    // for long press handling
    this._isLongPress = false;

    this._viewStyles = {
      style: {
        marginLeft: this._currentPosition.x - (markerSize / 2) / this._scale,
        marginTop: this._currentPosition.y - (markerSize / 2) / this._scale
      }
    };
  }

  getMovable = () => this.props.movable !== undefined ? this.props.movable : true;

  setPosition = (x, y) => {
    this._currentPosition.x = x;
    this._currentPosition.y = y;
    this.updatePosition();
  }
}
  setScale = (scale) => {
      // ...long-running synchronous task...

    this._scale = scale;
    console.log(this._scale, "scale")
    console.log(this._scale.toFixed(1) % 1 === 0)

    if(this._scale.toFixed(1) % 1 === 0){
      this._scaleStyles = { 
        style: { width: markerSize / this._scale, height: markerSize / this._scale }
      };
      this._scaleChildStyles = { 
        style: { width: markerSize / this._scale * 0.5, height: markerSize / this._scale * 0.5 }
      };
      this._view.setNativeProps(this._scaleStyles)
      this._viewChild.setNativeProps(this._scaleChildStyles)
    }

    this._viewStyles.style.marginLeft = this.props.posX - (markerSize / 2) / scale;
    this._viewStyles.style.marginTop = this.props.posY - (markerSize / 2) / scale;
    this.updateNativeStyles();


  };

  updatePosition = () => {
    this.handlePanResponderMove(null, { dx: 0, dy: 0 });
  };

  // eslint-disable-next-line react/no-deprecated
  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => this.getMovable(), //{this.getMovable()},
      onStartShouldSetPanResponderCapture: (e, gestureState)=> {
        this._startTimestamp = e.nativeEvent.timestamp,
         console.log(e.nativeEvent, "ci 1")
      },

      onMoveShouldSetPanResponder: () => this.getMovable(), 
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: (evt, gestureState) => console.log("oother"),
      onShouldBlockNativeResponder: (evt, gestureState) => this.getMovable()
    });
  }

  componentDidMount() {
    this._scaleStyles = {
      style: {  width: markerSize / this._scale, height: markerSize / this._scale }
    };
    this._scaleChildStyles = {
      style: { width: markerSize / this._scale * 0.5, height: markerSize / this._scale * 0.5 }
    };
    this._view.setNativeProps(this._scaleStyles)
    this._viewChild.setNativeProps(this._scaleChildStyles)

    this.updateNativeStyles();
  }

  updateNativeStyles = () => {
    this._view && this._view.setNativeProps(this._viewStyles);
  };

  handlePanResponderGrant = () => {
    this.isMoved = false;
    this.longPress = setTimeout(() => {
      if(!this.isMoved) {
        this.onLongPress();
        this._isLongPress = true;
      }
    }, LONG_PRESS_TIMEOUT);

    this.setOpacity(.7);
  };

  handlePanResponderMove = (e, gestureState) => {
    if(Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10) {
      this.isMoved = true;
    }
    const currentX = this._currentPosition.x + gestureState.dx / this._scale;
    const currentY = this._currentPosition.y + gestureState.dy / this._scale;
    
    this._viewStyles.style.marginLeft = currentX - (markerSize / 2) / this._scale;
    this._viewStyles.style.marginTop = currentY - (markerSize / 2) / this._scale;

    this.updateNativeStyles();
  };

  handlePanResponderEnd = (e, gestureState) => {
    console.log(e.nativeEvent.timestamp - this._startTimestamp, "this._startTimestamp")
    this._isLongPress = e.nativeEvent.timestamp - this._startTimestamp >= 1500;
    if (gestureState.dx !== 0 || gestureState.dy !== 0) {
      this._currentPosition.x += gestureState.dx / this._scale;
      this._currentPosition.y += gestureState.dy / this._scale;
      this.onChange(this._currentPosition.x, this._currentPosition.y);
    } else {
      if(!this._isLongPress) {
        this.onPress()
      } else {
        this.onLongPress();
        this._isLongPress = false;
      }
    }
    this.setOpacity(1);
  };

  setOpacity = value => {
    this._opacityProp = {
      style: {
        zIndex: 500,
        opacity: value
      }
    };
    this._opacity && this._opacity.setNativeProps(this._opacityProp)
  };

  render() {
    return (
      <View
        style={styles.container(this.props)}
        ref={view => this._view = view}
        {...this._panResponder.panHandlers}
      >
        <View style={styles.zIndex500}>
          <Image ref={view => {this._viewChild = view}} style={styles.markerImage} source={this.props.source}/>
        </View>
        {this.props.isLighted &&
          <View style={styles.lighted(this.props)}/>
        }
        {this.props.isShaded && <View style={styles.shaded(this.props)} />}
      </View>
    );
  }
}

const LIGHTED_BORDER_WIDTH = 3;

const base = (obj, zIndex) => ({
  zIndex: 9999,
  elevation: 10,
  width: markerSize,
  height: markerSize,
  position: "absolute",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 45,
  shadowColor: color.primary(),
  shadowOffset: { height: 40 },
  shadowOpacity: 0.32,
  shadowRadius: 27,
  // elevation: 10,
  backgroundColor: color.primary(.6)
});

const shift = (lighted, shaded) => lighted && shaded ? 2 : (shaded ? 0 : 2)

const special = (obj, zIndex, shaded = false) => ({
  ...base(obj, zIndex),
  zIndex: 999,
  elevation: 4,
  marginBottom: shift(obj.isLighted, shaded),
  marginRight: shift(obj.isLighted, shaded),
});

const styles = StyleSheet.create({
  markerImage: {
    resizeMode: "contain",
    width: markerSize / 2,
    height: markerSize / 2,
  },
  zIndex500: { zIndex: 500 },
  container: obj => base(obj, 399),
  lighted: obj => ({
    ...special(obj, 600),
    borderWidth: obj.isLighted ? LIGHTED_BORDER_WIDTH : 0,
    borderColor: obj.tintColor,
  }),
  shaded: obj => ({
    ...special(obj, 999, true),
    backgroundColor: color.white(0.5),
  })
});

export default Draggable;

