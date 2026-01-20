import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Colors from "../../constants/Colors";

interface RiderTermsProps {
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
  handleBecomeRider: () => void;
  becomingRider: boolean;
}

const RiderTermsAndConditions = ({
  termsAccepted,
  setTermsAccepted,
  handleBecomeRider,
  becomingRider,
}: RiderTermsProps) => {
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
      <TouchableOpacity
        className="bg-mates-orange py-4 px-6 rounded-full w-full"
        onPress={handlePresentModalPress}
      >
        <Text className="text-black font-bold text-center text-lg">
          Register as Partner
        </Text>
      </TouchableOpacity>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetScrollView style={styles.sheetScrollView}>
          {/* Header removed */}
          <Text style={styles.sectionTitle}>Eligibility</Text>
          <Text style={styles.modalText}>
            • Riders must be enrolled as students at HKUST.{"\n"}• Riders must
            be able to provide proof of student status.
          </Text>

          <Text style={styles.sectionTitle}>
            Registration and Authentication
          </Text>
          <Text style={styles.modalText}>
            • Riders must complete the registration process, providing accurate
            personal information and consenting to identity verification.{"\n"}•
            Riders are responsible for maintaining the confidentiality of their
            account credentials and notifying the developers of this app
            immediately of any unauthorized access.
          </Text>

          <Text style={styles.sectionTitle}>
            Compliance with Food Safety and Hygiene Standards
          </Text>
          <Text style={styles.modalText}>
            • Riders must adhere to the FEHD Practical Guide on Take-away Meal
            and Meal Delivery Services, including:{"\n"}• Maintaining personal
            hygiene, such as washing hands before handling food and wearing
            clean attire.{"\n"}• Ensuring delivery containers are clean,
            well-maintained, and free from contamination.{"\n"}• Keeping food at
            safe temperatures during delivery: hot foods above 60°C, cold foods
            at or below 4°C, and frozen foods in a frozen state.{"\n"}•
            Preventing cross-contamination by separating raw and cooked foods
            and using appropriate packaging.{"\n"}• Delivering food within the
            shortest possible time to minimize the risk of bacterial growth,
            specifically within 1 hour after accepting order.{"\n"}• Riders must
            complete mandatory food safety training provided by FoodMates,
            covering FEHD guidelines and best practices.
          </Text>

          <Text style={styles.sectionTitle}>Delivery Responsibilities</Text>
          <Text style={styles.modalText}>
            • Riders must collect orders promptly from designated campus food
            outlets and deliver them to customers as quickly as possible to
            ensure freshness and customer satisfaction.{"\n"}• Riders must
            verify the order contents and ensure food is securely packaged
            before delivery.{"\n"}• Riders must not tamper with, open, or
            consume any part of the food order.{"\n"}• Riders must follow the
            FoodMates' protocols for handling customer complaints, including
            reporting issues promptly via the calling the developers.
          </Text>

          <Text style={styles.sectionTitle}>Conduct and Professionalism</Text>
          <Text style={styles.modalText}>
            • Riders must interact with customers, food outlet staff, and other
            campus personnel courteously and professionally.{"\n"}• Riders must
            not engage in discriminatory behavior, harassment, or any conduct
            that harms the FoodMates' reputation.{"\n"}• Riders must comply with
            campus policies, including parking, pedestrian, and noise
            regulations.
          </Text>

          <Text style={styles.sectionTitle}>Payment and Earnings</Text>
          <Text style={styles.modalText}>
            • Riders will be compensated per delivery based on the payment
            structure, communicated during registration.{"\n"}• Payments will be
            processed weekly via bank transfer.{"\n"}• Riders are responsible
            for any costs related to equipment, transportation, or mobile data
            usage.
          </Text>

          <Text style={styles.sectionTitle}>Liability and Insurance</Text>
          <Text style={styles.modalText}>
            • Riders are responsible for their own safety and must exercise
            caution during deliveries to avoid accidents or injuries.{"\n"}•
            FoodMates is not liable for any loss, damage, or injury sustained by
            Riders during the course of their duties, except as required by law.
            {"\n"}• Riders are encouraged to maintain personal insurance
            coverage for accidents or injuries.
          </Text>

          <Text style={styles.sectionTitle}>Record-Keeping</Text>
          <Text style={styles.modalText}>
            • Riders must maintain delivery records, including order details and
            delivery times, for at least 60 days, as recommended by the FEHD
            Guide.{"\n"}• Records must be made available to the FoodMates or
            regulatory authorities upon request.
          </Text>

          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.modalText}>
            • The FoodMates reserves the right to terminate a Rider's
            participation for:{"\n"}• Non-compliance with these Terms or FEHD
            guidelines.{"\n"}• Repeated customer complaints or failure to meet
            delivery standards.{"\n"}• Fraudulent activity, including
            misrepresenting delivery status or tampering with orders.{"\n"}•
            Violation of campus policies or applicable laws.{"\n"}• Riders may
            terminate their participation by providing 3 days' written notice to
            FoodMates.
          </Text>

          <Text style={styles.sectionTitle}>Dispute Resolution</Text>
          <Text style={styles.modalText}>
            Any disputes arising from these Terms will be resolved through
            negotiation in good faith. If unresolved, disputes will be subject
            to the jurisdiction of Hong Kong courts.
          </Text>

          <Text style={styles.sectionTitle}>Amendments</Text>
          <Text style={styles.modalText}>
            The FoodMates reserves the right to amend these Terms at any time.
            Riders will be notified of changes via the app or email, and
            continued participation constitutes acceptance of the updated Terms.
          </Text>

          <Text style={styles.modalText}>
            By registering as a Rider, you acknowledge that you have read,
            understood, and agree to be bound by these Terms and Conditions. For
            further information, contact FoodMates support at{" "}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL("mailto:Foodmates.Team@gmail.com")}
            >
              Foodmates.Team@gmail.com
            </Text>
            .
          </Text>

          <Text style={styles.referenceText}>
            Reference: Food and Environmental Hygiene Department, Practical
            Guide on Take-away Meal and Meal Delivery Services,{" "}
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  "https://www.fehd.gov.hk/english/licensing/guide_general_reference/Practical_Guide_on_Take_away_Meal_and_Meal_Delivery_Services.pdf"
                )
              }
            >
              https://www.fehd.gov.hk/english/licensing/guide_general_reference/Practical_Guide_on_Take_away_Meal_and_Meal_Delivery_Services.pdf
            </Text>
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
              style={[
                styles.becomeRiderButton,
                !termsAccepted && styles.disabledButton,
              ]}
              onPress={handleBecomeRider}
              disabled={!termsAccepted || becomingRider}
            >
              <Text style={styles.buttonText}>
                {becomingRider ? "Processing..." : "Become Partner"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 10 }]}
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
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
  },
  bottomSheetIndicator: {
    backgroundColor: Colors.lightText,
  },
  sheetScrollView: {
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
    paddingHorizontal: 16,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
    color: Colors.text,
    paddingHorizontal: 16,
  },
  referenceText: {
    fontSize: 12,
    color: "#888",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  bottomSheetActions: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 100, // Significantly increased bottom padding for more space
  },
  termsAcceptContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  termsAcceptText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  becomeRiderButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  closeButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  closeButtonText: {
    color: "#333",
  },
  buttonText: {
    color: "black",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});

export default RiderTermsAndConditions;
