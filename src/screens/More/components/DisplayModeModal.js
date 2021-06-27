import React from "react";
import { StyleSheet } from "react-native";
import { Portal, Modal, Checkbox } from "react-native-paper";
import { setAppSettings } from "../../../redux/settings/settings.actions";

const DisplayModeModal = ({
    theme,
    dispatch,
    displayMode,
    hideDisplayModal,
    displayModalVisible,
}) => {
    const displayModes = [
        { displayMode: 0, label: "Compact Grid" },
        { displayMode: 1, label: "Comfortable Grid" },
        { displayMode: 2, label: "List" },
    ];

    const renderCheckboxes = () => {
        return displayModes.map((mode) => (
            <Checkbox.Item
                key={mode.displayMode}
                label={mode.label}
                labelStyle={{ color: theme.textColorPrimary }}
                status={
                    displayMode === mode.displayMode ? "checked" : "unchecked"
                }
                mode="ios"
                uncheckedColor={theme.textColorSecondary}
                color={theme.colorAccent}
                onPress={() =>
                    dispatch(setAppSettings("displayMode", mode.displayMode))
                }
            />
        ));
    };

    return (
        <Portal>
            <Modal
                visible={displayModalVisible}
                onDismiss={hideDisplayModal}
                contentContainerStyle={[
                    styles.containerStyle,
                    { backgroundColor: theme.colorPrimaryDark },
                ]}
            >
                {renderCheckboxes()}
            </Modal>
        </Portal>
    );
};

export default DisplayModeModal;

const styles = StyleSheet.create({
    containerStyle: {
        padding: 20,
        margin: 20,
        borderRadius: 6,
    },
});