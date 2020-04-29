import * as React from "react";
import { View, PanResponder, StyleSheet } from "react-native";
import * as LOGIC from "./Logic";

const MINIMAL_DISTANCE_TO_MOVE = 5;

class Draggable extends React.Component {

  constructor(props) {
    super(props)

    this._backgroundSize = this.props.imageSize !== undefined
      ? props.imageSize
      : { width: 2000, height: 2000 }

    this._scaleBounds = LOGIC.scaleBounds(this._backgroundSize)
    this._lastScale = this._scaleBounds.min;
    this._currentScale = this._scaleBounds.min;

    this._borders = LOGIC.borders(this._backgroundSize, this._currentScale);
    this._currentX = props.position !== undefined ? props.position.x + this._borders.left : this._borders.left;
    this._currentY = props.position !== undefined ? props.position.y + this._borders.top : this._borders.top;

    this._isMovable = props.movable !== undefined ? props.movable : true
    this._isScalable = props.scalable !== undefined ? props.scalable : false
    this._isClickable = props.clickable !== undefined ? props.clickable : false

    this._child = props.child !== undefined ? props.child : false

    this.onDrag = props.onDrag !== undefined ? props.onDrag : () => {
      // eslint-disable-next-line no-console
      if (this._isMovable) console.log("Draggable Constructod -> onDrag method is not defined")
    }
    this.onPress = props.onPress !== undefined ? props.onPress : () => {
      // eslint-disable-next-line no-console
      if (this._isClickable) console.log("Draggable Constructod -> onPress method is not defined")
    }
    this.onScale = props.onScale !== undefined ? props.onScale : () => {
      // eslint-disable-next-line no-console
      if (this._isScalable) console.log("Draggable Constructor -> onScale method is not defined!")
    }

    this._initialTouches = [];
    this._currentTouches = [];

    this._viewStyles = {
      style: {
        width: this._backgroundSize.width,
        height: this._backgroundSize.height,
        marginLeft: this._currentX,
        marginTop: this._currentY,
        transform: [{ scale: this._lastScale }]
      },
    };

    // send calculated scale and position values to parent.
    this.onScale(this._currentScale);
    this.onDrag(this._viewStyles.style.left, this._viewStyles.style.top)
  }

  setScaleFactor = (value) => {
    this._viewStyles.style.transform = [{ scale: value }];
    this._currentScale = value;
  };

  componentDidMount() {
    this.updateNativeStyles();
  }

  updateNativeStyles = () => {
    this._view && this._view.setNativeProps(this._viewStyles);
  };

  /** method for programmatically returning into initial position before taking screenshot */
  returnToInitialPosition = () => {
    this.handleScale(this._scaleBounds.min);
    this._viewStyles.style.left = this._borders.left;
    this._viewStyles.style.top = this._borders.top;
    this._currentX = this._borders.left;
    this._currentY = this._borders.top;
    this.blockEmptySpaceAppearance(0, 0);
    this.onDrag(this._borders.left, this._borders.top);
    this.updateNativeStyles();
  }

  UNSAFE_componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () =>  this.handleStartShouldSetPanResponder,
      onStartShouldSetPanResponderCapture: (e, gestureState) => console.log(e.nativeEvent, "cb"),
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
    });
  }
  handleStartShouldSetPanResponder = () => {
    // Should we become active when the user presses down on the component?
    this._initialTouches = [];
    this._currentTouches = [];
    return true;
  };
  handleMoveShouldSetPanResponder = () => {
    return true;
  };
  handlePanResponderMove = (e, gestureState) => {
    const touches = e.nativeEvent.touches;
    if (touches.length !== this._initialTouches.length) {
      this._initialTouches = touches;
    }

    if (gestureState.numberActiveTouches === 1) {
      // single touch
      if (this._isMovable) {
        this.handleDrag(gestureState.dx, gestureState.dy);
        // eslint-disable-next-line no-console
      } else console.log("Component is not movable! set up movable={true} prop");
    } else {
      // multi touch
      if (this._isScalable) {
        this.handleMultiTouch(e);
        // eslint-disable-next-line no-console
      } else console.log("Component is not scalable! set up scalable={true} prop");
    }
    this.updateNativeStyles();
  };
  handleDrag = (dx, dy) => {
    this.blockEmptySpaceAppearance(dx, dy);
    this.onDrag(this._viewStyles.style.left, this._viewStyles.style.top);
  }
  blockEmptySpaceAppearance = (x, y) => {
    // block empty space appearance (left & right sides)
    if (this._currentX + x > this._borders.left) {
      this._viewStyles.style.left = this._borders.left;
    } else if (this._currentX + x < this._borders.right) {
      this._viewStyles.style.left = this._borders.right;
    } else {
      this._viewStyles.style.left = this._currentX + x;
    }
    // top & bottom
    if (this._currentY + y > this._borders.top) {
      this._viewStyles.style.top = this._borders.top;
    } else if (this._currentY + y < this._borders.bottom) {
      this._viewStyles.style.top = this._borders.bottom;
    } else {
      this._viewStyles.style.top = this._currentY + y;
    }
  }
  handleMultiTouch = (event) => {
    this._currentTouches = event.nativeEvent.touches;
    const scale = LOGIC.getScaleFactor(this._lastScale, this._currentTouches, this._initialTouches);
    this.handleScale(scale);
    this.handleDrag(0, 0);
  }
  /** @param {number} scaleFactor calculated scale factor to be set as current */
  handleScale = (scaleFactor) => {
    this.isScaled = true;
    // let currentFactor = scaleFactor;
    if (scaleFactor > this._scaleBounds.max) {
      scaleFactor = this._scaleBounds.max;
    } else if (scaleFactor < this._scaleBounds.min) {
      scaleFactor = this._scaleBounds.min;
    }

    //update current scaleFactor & borders and run callback
    this.setScaleFactor(scaleFactor);
    this.onScale(scaleFactor);
    this._borders = LOGIC.borders(this._backgroundSize, scaleFactor);
  }
  handlePanResponderEnd = (e, gestureState) => {
    if (Math.abs(gestureState.dx) < MINIMAL_DISTANCE_TO_MOVE &&
      Math.abs(gestureState.dy) < MINIMAL_DISTANCE_TO_MOVE) {
      if (!this.isScaled) {
        this.onPress(e.nativeEvent.locationX, e.nativeEvent.locationY);
      }
    } else {
      this._currentX = this._viewStyles.style.left;
      this._currentY = this._viewStyles.style.top;
    }
    this.isScaled = false;
    this._lastScale = this._viewStyles.style.transform[0].scale;
  };

  render() {
    return (
      <View
        style={styles.view}
        collapsable={false}
        ref={view => { this._view = view }}
        {...this._panResponder.panHandlers} 
      >
        {this.props.children}
        {this.props.bg}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  view: {
    elevation:0,
    zIndex:900,
    backgroundColor: "transparent",
  }
})

export default Draggable;
