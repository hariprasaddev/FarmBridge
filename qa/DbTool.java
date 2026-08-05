import java.sql.*;

/**
 * QA helper — direct MySQL access for test verification.
 * Used ONLY by the QA suite to read reset tokens, verify stock,
 * seed an admin account, and run cleanup. Does not modify app code.
 *
 * Usage:
 *   java DbTool counts
 *   java DbTool get-token <email>
 *   java DbTool set-token-expiry <token> "yyyy-MM-dd HH:mm:ss"
 *   java DbTool get-qty <productId>
 *   java DbTool get-user-id <email>
 *   java DbTool insert-admin <email> <name> <bcryptHash>
 *   java DbTool set-password <email> <bcryptHash>
 *   java DbTool delete-tokens <email>
 */
public class DbTool {

    private static final String URL = "jdbc:mysql://localhost:3306/farmbridge";
    private static final String USER = "root";
    private static final String PASS = "Hari@1849";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: java DbTool <cmd> [args...]");
            System.exit(2);
        }
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection c = DriverManager.getConnection(URL, USER, PASS)) {
            switch (args[0]) {
                case "counts" -> counts(c);
                case "get-token" -> getToken(c, args[1]);
                case "set-token-expiry" -> setTokenExpiry(c, args[1], args[2]);
                case "get-qty" -> System.out.println(getQty(c, Long.parseLong(args[1])));
                case "get-user-id" -> System.out.println(getUserId(c, args[1]));
                case "insert-admin" -> insertAdmin(c, args[1], args[2], args[3]);
                case "set-password" -> setPassword(c, args[1], args[2]);
                case "delete-tokens" -> deleteTokens(c, args[1]);
                default -> System.err.println("Unknown command: " + args[0]);
            }
        }
    }

    private static void counts(Connection c) throws SQLException {
        String[] tables = {"users", "products", "orders", "farmer_profiles",
                "reviews", "wishlist", "notifications", "password_reset_tokens"};
        for (String t : tables) {
            try (Statement s = c.createStatement()) {
                ResultSet rs = s.executeQuery("SELECT COUNT(*) FROM " + t);
                rs.next();
                System.out.println(t + "=" + rs.getLong(1));
            } catch (SQLException e) {
                System.out.println(t + "=ERROR:" + e.getMessage());
            }
        }
    }

    private static void getToken(Connection c, String email) throws SQLException {
        String sql = "SELECT token FROM password_reset_tokens t " +
                "JOIN users u ON t.user_id = u.id WHERE u.email = ? " +
                "ORDER BY t.expiry_time DESC LIMIT 1";
        try (PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) System.out.println(rs.getString(1));
        }
    }

    private static void setTokenExpiry(Connection c, String token, String expiry) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "UPDATE password_reset_tokens SET expiry_time = ? WHERE token = ?")) {
            ps.setString(1, expiry);
            ps.setString(2, token);
            System.out.println("updated=" + ps.executeUpdate());
        }
    }

    private static long getQty(Connection c, long id) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT quantity FROM products WHERE id = ?")) {
            ps.setLong(1, id);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? rs.getLong(1) : -1;
        }
    }

    private static long getUserId(Connection c, String email) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id FROM users WHERE email = ?")) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            return rs.next() ? rs.getLong(1) : -1;
        }
    }

    private static void insertAdmin(Connection c, String email, String name, String hash) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'ADMIN')")) {
            ps.setString(1, name);
            ps.setString(2, email);
            ps.setString(3, hash);
            ps.executeUpdate();
            System.out.println("admin inserted");
        } catch (SQLException e) {
            System.out.println("insert failed: " + e.getMessage());
        }
    }

    private static void setPassword(Connection c, String email, String hash) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "UPDATE users SET password = ? WHERE email = ?")) {
            ps.setString(1, hash);
            ps.setString(2, email);
            System.out.println("updated=" + ps.executeUpdate());
        }
    }

    private static void deleteTokens(Connection c, String email) throws SQLException {
        try (PreparedStatement ps = c.prepareStatement(
                "DELETE t FROM password_reset_tokens t JOIN users u ON t.user_id = u.id WHERE u.email = ?")) {
            ps.setString(1, email);
            System.out.println("deleted=" + ps.executeUpdate());
        }
    }
}
