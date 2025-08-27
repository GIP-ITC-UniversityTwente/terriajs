import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { IButtonProps } from "./Button";

export interface IStyledTabButton extends IButtonProps {
  isActive?: boolean;
}

// Types
interface TabProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  ref?: React.Ref<HTMLButtonElement>;
  activeIndex?: number;
  onTabChange: (index: number) => void;
}

const TabButton = styled.div<IStyledTabButton>`
  padding: 5px 20px;
  cursor: pointer;
  border: ${(props) => (props.isActive ? "1px solid white" : "none")};
  background: transparent;
  border-bottom: ${(props) => (props.isActive ? "2px solid #3f4854" : "none")};
  color: #fff;
  margin-bottom: -1px;
  border-radius: 3px 3px 0 0;
  margin-left: 10px;
  margin-right: 10px;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #fff;
  color: #fff;
  width: 100%;
  margin-top: 5px;
`;

// Components
class Tab extends React.Component<TabProps> {
  render() {
    const { label, isActive = false, onClick } = this.props;
    return (
      <TabButton isActive={isActive} onClick={onClick}>
        {label}
      </TabButton>
    );
  }
}

class Tabs extends React.Component<TabsProps> {
  render() {
    const { children, activeIndex, onTabChange } = this.props;
    const tabs = React.Children.map(children, (child, index) => {
      if (!React.isValidElement<TabProps>(child)) return null;

      return React.cloneElement(child, {
        isActive: index === activeIndex,
        onClick: () => onTabChange(index)
      });
    });

    return <TabsContainer>{tabs}</TabsContainer>;
  }
}

export { Tabs, Tab };
