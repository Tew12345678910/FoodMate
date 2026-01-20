import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Colors from "../../constants/Colors";

interface RegisterTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
}

const RegisterTermsAndConditions = ({
  termsAccepted,
  setTermsAccepted,
}: RegisterTermsProps) => {
  // Bottom sheet reference
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = ["25%", "80%"];

  // Callbacks for the bottom sheet
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("Bottom sheet index changed:", index);
  }, []);

  return (
    <>
      <View style={styles.termsContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <Ionicons
            name={termsAccepted ? "checkbox" : "square-outline"}
            size={24}
            color={termsAccepted ? Colors.primary : Colors.lightText}
          />
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I accept the{" "}
          <Text style={styles.termsLink} onPress={handlePresentModalPress}>
            Terms and Conditions
          </Text>
        </Text>
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetScrollView style={styles.sheetScrollView}>
          <Text style={styles.modalTitle}>Terms and Conditions</Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.modalText}>
            By using our food delivery app, you agree to these Terms and
            Conditions. If you do not agree, please do not use the app.
          </Text>

          <Text style={styles.sectionTitle}>2. User Information</Text>
          <Text style={styles.modalText}>
            We collect the following personal information:{"\n"}• Username
            {"\n"}• University Email Address{"\n"}• Phone Number{"\n\n"}
            Your information is used for account creation, order processing, and
            communication regarding your orders.
          </Text>

          <Text style={styles.sectionTitle}>3. Privacy Policy</Text>
          <Text style={styles.modalText}>
            We are committed to protecting your privacy. Your personal
            information will not be sold, rented, or disclosed to third parties
            without your consent, except as required by law.
          </Text>

          <Text style={styles.sectionTitle}>4. User Accounts</Text>
          <Text style={styles.modalText}>
            You are responsible for maintaining the confidentiality of your
            account information and for all activities that occur under your
            account. Notify us immediately of any unauthorized use of your
            account.
          </Text>

          <Text style={styles.sectionTitle}>5. Use of the App</Text>
          <Text style={styles.modalText}>
            You agree to use the app only for lawful purposes and in accordance
            with these Terms. You are prohibited from:{"\n"}• Using the app in
            any way that violates applicable laws or regulations.{"\n"}•
            Transmitting any material that could harm or disrupt the app.
          </Text>

          <Text style={styles.sectionTitle}>6. Modifications</Text>
          <Text style={styles.modalText}>
            We reserve the right to modify these Terms and Conditions at any
            time. Users will be notified of significant changes, and continued
            use of the app constitutes acceptance of the modified terms.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.modalText}>
            To the fullest extent permitted by law, we are not liable for any
            direct, indirect, incidental, or consequential damages arising from
            your use of the app.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact Information</Text>
          <Text style={styles.modalText}>
            For any questions about these Terms and Conditions, please contact
            us at{" "}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL("mailto:FoodMates.Team@gmail.com")}
            >
              FoodMates.Team@gmail.com
            </Text>
            .
          </Text>

          <Text style={styles.modalText}>
            By using our app, you acknowledge that you have read, understood,
            and agree to be bound by these Terms and Conditions.
          </Text>

          <View style={styles.bottomSheetActions}>
            <TouchableOpacity
              style={styles.termsAcceptContainer}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <Ionicons
                name={termsAccepted ? "checkbox" : "square-outline"}
                size={24}
                color={termsAccepted ? Colors.primary : Colors.lightText}
              />
              <Text style={styles.termsAcceptText}>
                I accept the terms and conditions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 20 }]}
              onPress={() => bottomSheetModalRef.current?.dismiss()}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 16,
    color: Colors.text,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
  },
  bottomSheetIndicator: {
    backgroundColor: Colors.lightText,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sheetScrollView: {
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: Colors.text,
    paddingHorizontal: 16,
  },
  modalText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bottomSheetActions: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40, // Significantly increased bottom padding from 40 to 80
  },
  termsAcceptContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  termsAcceptText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  closeButtonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 16,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});

export default RegisterTermsAndConditions;
