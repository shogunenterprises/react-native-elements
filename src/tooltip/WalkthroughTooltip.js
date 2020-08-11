import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Modal, View, StatusBar } from 'react-native';

import { ViewPropTypes, withTheme } from '../config';
import { ScreenWidth, ScreenHeight, isIOS } from '../helpers';

import Triangle from './Triangle';
import getTooltipCoordinate, {
  getElementVisibleWidth,
} from './getTooltipCoordinate';

class WalkthroughTooltip extends React.PureComponent {
  state = {
    isVisible: false,
    yOffset: 0,
    xOffset: 0,
    elementWidth: 0,
    elementHeight: 0,
  };

  renderedElement;

  toggleTooltip = () => {
    const { onClose } = this.props;
    this.getElementPosition();
    this.setState(prevState => {
      if (prevState.isVisible && !isIOS) {
        onClose && onClose();
      }

      return { isVisible: !prevState.isVisible };
    });
  };

  wrapWithPress = (toggleOnPress, children) => {
    if (toggleOnPress) {
      return <View>{children}</View>;
    }

    return children;
  };

  getTooltipStyle = () => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const {
      height,
      backgroundColor,
      width,
      withPointer,
      containerStyle,
    } = this.props;

    const { x, y } = getTooltipCoordinate(
      xOffset,
      yOffset,
      elementWidth,
      elementHeight,
      ScreenWidth,
      ScreenHeight,
      width,
      height,
      withPointer
    );

    return {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      backgroundColor,
      // default styles
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      borderRadius: 10,
      padding: 10,
      ...containerStyle,
    };
  };

  renderPointer = tooltipY => {
    const { yOffset, xOffset, elementHeight, elementWidth } = this.state;
    const { backgroundColor, pointerColor } = this.props;
    const pastMiddleLine = yOffset > tooltipY;

    return (
      <View
        style={{
          position: 'absolute',
          top: pastMiddleLine ? yOffset - 13 : yOffset + elementHeight - 2,
          left:
            xOffset +
            getElementVisibleWidth(elementWidth, xOffset, ScreenWidth) / 2 -
            7.5,
        }}
      >
        <Triangle
          style={{ borderBottomColor: pointerColor || backgroundColor }}
          isDown={pastMiddleLine}
        />
      </View>
    );
  };

  renderContent = withTooltip => {
    const {
      popover,
      withPointer,
      toggleOnPress,
      highlightColor,
      onPress,
      renderedContainerStyles,
    } = this.props;

    if (!withTooltip) {
      return this.wrapWithPress(toggleOnPress, this.props.children);
    }

    const { yOffset, xOffset, elementWidth, elementHeight } = this.state;
    const tooltipStyle = this.getTooltipStyle();
    return (
      <View>
        <View
          style={{
            position: 'absolute',
            top: yOffset,
            left: xOffset,
            backgroundColor: highlightColor,
            overflow: 'visible',
            width: elementWidth,
            height: elementHeight,
            borderRadius: elementHeight * 0.5,
          }}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={1}
            style={{
              flex: 1,
              ...renderedContainerStyles,
            }}
          >
            <View
              pointerEvents="box-only"
              style={{
                flex: 1,
              }}
            >
              {this.props.children}
            </View>
          </TouchableOpacity>
        </View>
        {withPointer && this.renderPointer(tooltipStyle.top)}
        <View style={tooltipStyle} testID="tooltipPopoverContainer">
          {popover}
        </View>
      </View>
    );
  };

  componentDidMount() {
    // wait to compute onLayout values.
    setTimeout(this.getElementPosition, 500);
  }

  getElementPosition = () => {
    this.renderedElement &&
      this.renderedElement.measure(
        (
          frameOffsetX,
          frameOffsetY,
          width,
          height,
          pageOffsetX,
          pageOffsetY
        ) => {
          this.setState({
            xOffset: pageOffsetX,
            yOffset: isIOS
              ? pageOffsetY
              : pageOffsetY - StatusBar.currentHeight,
            elementWidth: width,
            elementHeight: height,
            isVisible: true,
          });
        }
      );
  };

  render() {
    const { isVisible } = this.state;
    const { onClose, withOverlay, overlayColor, onOpen } = this.props;

    return (
      <View
        collapsable={false}
        ref={e => {
          this.renderedElement = e;
        }}
      >
        {this.renderContent(false)}
        <Modal
          animationType="fade"
          visible={isVisible}
          transparent
          onDismiss={onClose}
          onShow={onOpen}
          onRequestClose={onClose}
        >
          <View style={styles.container(withOverlay, overlayColor)}>
            {this.renderContent(true)}
          </View>
        </Modal>
      </View>
    );
  }
}

WalkthroughTooltip.propTypes = {
  children: PropTypes.element,
  withPointer: PropTypes.bool,
  popover: PropTypes.element,
  toggleOnPress: PropTypes.bool,
  height: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  containerStyle: ViewPropTypes.style,
  renderedContainerStyles: ViewPropTypes.style,
  pointerColor: PropTypes.string,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  onPress: PropTypes.func,
  overlayColor: PropTypes.string,
  withOverlay: PropTypes.bool,
  backgroundColor: PropTypes.string,
  highlightColor: PropTypes.string,
};

WalkthroughTooltip.defaultProps = {
  withOverlay: true,
  overlayColor: 'rgba(250, 250, 250, 0.70)',
  highlightColor: 'transparent',
  withPointer: true,
  toggleOnPress: true,
  height: 40,
  width: 150,
  containerStyle: {},
  renderedContainerStyles: {},
  backgroundColor: '#617080',
  onClose: () => {},
  onOpen: () => {},
  onPress: () => {},
};

const styles = {
  container: (withOverlay, overlayColor) => ({
    backgroundColor: withOverlay ? overlayColor : 'transparent',
    flex: 1,
  }),
};

export { WalkthroughTooltip };
export default withTheme(WalkthroughTooltip, 'Tooltip');
