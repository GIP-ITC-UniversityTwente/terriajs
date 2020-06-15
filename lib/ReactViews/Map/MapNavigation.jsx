import Compass from "./Navigation/Compass";
import MyLocation from "./Navigation/MyLocation";
import PropTypes from "prop-types";
import React from "react";
import { Medium } from "../Generic/Responsive";
import Styles from "./map-navigation.scss";
import ToggleSplitterTool from "./Navigation/ToggleSplitterTool";
import ViewerMode from "../../Models/ViewerMode";
import ZoomControl from "./Navigation/ZoomControl";

import classNames from "classnames";
import { observer } from "mobx-react";
import defined from "terriajs-cesium/Source/Core/defined";
// import HelpTool from "./Navigation/HelpTool";
// import StylesToolButton from "./Navigation/tool_button.scss";
import Icon from "../Icon";

// import Icon from "../Icon";
import Box from "../../Styled/Box";
import MapIconButton from "../MapIconButton/MapIconButton";
import FeedbackButton from "../Feedback/FeedbackButton";
import CloseToolButton from "./Navigation/CloseToolButton";

// The map navigation region
@observer
class MapNavigation extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    navItems: PropTypes.arrayOf(PropTypes.element)
  };

  static defaultProps = {
    navItems: []
  };

  render() {
    const toolIsDifference =
      this.props.viewState.currentTool?.toolName === "Difference";
    const isDiffMode = this.props.viewState.isToolOpen && toolIsDifference;

    return (
      <div
        className={classNames(Styles.mapNavigation, {
          [Styles.withTimeSeriesControls]: defined(
            this.props.terria.timelineStack.top
          )
        })}
      >
        <Box centered column justifySpaceBetween fullHeight alignItemsFlexEnd>
          <Box column>
            <Medium>
              <div className={Styles.navs}>
                <If
                  condition={
                    this.props.terria.mainViewer.viewerMode ===
                    ViewerMode.Cesium
                  }
                >
                  <div className={Styles.control}>
                    <Compass
                      terria={this.props.terria}
                      viewState={this.props.viewState}
                    />
                  </div>
                </If>
                <div className={Styles.control}>
                  <ZoomControl terria={this.props.terria} />
                </div>
              </div>
            </Medium>
            <div className={Styles.controls}>
              <If
                condition={
                  !this.props.terria.configParameters.disableMyLocation
                }
              >
                <div className={Styles.control}>
                  <MyLocation terria={this.props.terria} />
                </div>
              </If>
              <If
                condition={
                  !this.props.terria.configParameters.disableSplitter &&
                  !isDiffMode
                }
              >
                <div className={Styles.control}>
                  <ToggleSplitterTool
                    terria={this.props.terria}
                    viewState={this.props.viewState}
                  />
                </div>
              </If>
              <If condition={this.props.viewState.currentTool?.showCloseButton}>
                <CloseToolButton
                  toolIsDifference={toolIsDifference}
                  viewState={this.props.viewState}
                />
              </If>
              <For each="item" of={this.props.navItems} index="i">
                <div className={Styles.control} key={i}>
                  {item}
                </div>
              </For>
            </div>
          </Box>
          <Box
            column
            // bottom map buttons
          >
            <div className={Styles.controls}>
              <div className={Styles.control}>
                <FeedbackButton
                  terria={this.props.terria}
                  viewState={this.props.viewState}
                />
              </div>
              <If condition={!this.props.viewState.useSmallScreenInterface}>
                <div className={Styles.control}>
                  <MapIconButton
                    expandInPlace
                    iconElement={() => <Icon glyph={Icon.GLYPHS.helpThick} />}
                    onClick={() => this.props.viewState.showHelpPanel()}
                  >
                    Help
                  </MapIconButton>
                </div>
              </If>
            </div>
          </Box>
        </Box>
      </div>
    );
  }
}

export default MapNavigation;
