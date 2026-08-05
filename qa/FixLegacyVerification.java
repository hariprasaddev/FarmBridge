import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * One-time data migration for the Day-16 verification workflow.
 *
 * Profiles approved under the old boolean-only flow have verified=1 but the
 * new verification_status column defaults to PENDING, which would lock those
 * farmers out of selling. Sync verified=1 -> APPROVED (and leave everything
 * else PENDING, the default for unverified accounts).
 */
public class FixLegacyVerification {

    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/farmbridge";
        String user = "root";
        String pass = "Hari@1849";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement st = conn.createStatement()) {

            int synced = st.executeUpdate(
                    "UPDATE farmer_profiles " +
                    "SET verification_status = 'APPROVED' " +
                    "WHERE verified = 1 AND verification_status <> 'APPROVED'");

            System.out.println("SYNCED " + synced + " legacy profiles to APPROVED");
        }
    }
}
