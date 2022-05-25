import { ReactElement, useState, MouseEvent } from "react";
import {
  Card,
  Popover,
  IconButton,
  icons,
  Autocomplete,
  TextField,
} from "@gliff-ai/style";

interface Props {
  currentUser: string;
  users: string[];
  changeUser: (username: string) => void;
  handleOpen: (
    event?: MouseEvent
  ) => (anchorElement?: HTMLButtonElement) => void;
}

let refBackgroundSettingsPopover: HTMLButtonElement;

export const UsersPopover = (props: Props): ReactElement => {
  console.log(props.currentUser);
  return (
    <Popover
      title="Select A User"
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      TriggerButton={
        <IconButton
          tooltip={{ name: "Select A User" }}
          icon={icons.usersPage}
          size="small"
          setRefCallback={(ref) => {
            refBackgroundSettingsPopover = ref;
          }}
          onClick={() => {
            props.handleOpen()(refBackgroundSettingsPopover);
          }}
        />
      }
    >
      <Autocomplete
        onChange={(event, value) => {
          props.changeUser(value);
        }}
        value={props.currentUser}
        key="input-user1"
        placeholder=""
        renderInput={(params) => (
          <TextField
            {...params} // eslint-disable-line react/jsx-props-no-spreading
            label="Username"
            autoFocus
            sx={{
              fontSize: 14,
              width: "300px",
              marginBottom: "20px",
              borderBottom: "solid 1px #dadde9",
            }}
          />
        )}
        options={props.users}
      />
    </Popover>
  );
};
