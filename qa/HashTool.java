import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** QA helper — prints the BCrypt hash of a password (for seeding the admin account). */
public class HashTool {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.err.println("Usage: java HashTool <password>");
            System.exit(2);
        }
        System.out.println(new BCryptPasswordEncoder().encode(args[0]));
    }
}
