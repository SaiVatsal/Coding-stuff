import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import org.ros.android.RosActivity;
import org.ros.android.view.visualization.RvizVisualizer;
import org.ros.node.Node;
import org.ros.node.NodeMain;
import org.ros.node.NodeMainExecutor;

public class MainActivity extends RosActivity implements NodeMain {

    private EditText ipAddressEditText;
    private Button connectButton;
    private TextView statusTextView;
    private RvizVisualizer rvizVisualizer;
    private Node node;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ipAddressEditText = findViewById(R.id.ip_address_edit_text);
        connectButton = findViewById(R.id.connect_button);
        statusTextView = findViewById(R.id.status_text_view);

        connectButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String ipAddress = ipAddressEditText.getText().toString();
                if (ipAddress.isEmpty()) {
                    Toast.makeText(MainActivity.this, "Please enter an IP address", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (node == null) {
                    node = new NodeMainExecutor().execute("android_app", new NodeMain() {
                        @Override
                        public void onStart(Node node) {
                            // Subscribe to the robot's odometry topic
                            node.subscribe("odom", Odometry.class, new OdometryCallback() {
                                @Override
                                public void onOdometry(Odometry odometry) {
                                    // Update the status TextView with the robot's position and orientation
                                    statusTextView.setText("Position: " + odometry.getPose().getPosition().getX() + ", " + odometry.getPose().getPosition().getY() + ", " + odometry.getPose().getPosition().getZ() + "\nOrientation: " + odometry.getPose().getOrientation().getX() + ", " + odometry.getPose().getOrientation
