package com.universalshared.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private LocalHttpServer server;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            server = new LocalHttpServer(this);
            server.start();
            Log.i("MainActivity", "Universal Shared embedded backend server started on port " + server.getPort());
        } catch (Exception e) {
            Log.e("MainActivity", "Failed to start embedded server: " + e.getMessage(), e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (server != null) {
            server.stop();
        }
    }
}