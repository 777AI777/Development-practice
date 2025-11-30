import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:uchi_no_manual/firebase_options.dart';
import 'package:uchi_no_manual/screens/add_item_screen.dart';
import 'package:uchi_no_manual/screens/item_list_screen.dart';
import 'package:uchi_no_manual/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'うちのマニュアル',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const CircularProgressIndicator();
          } else if (snapshot.hasData) {
            return const ItemListScreen();
          } else {
            return const LoginScreen();
          }
        },
      ),
      routes: {
        '/add_item': (context) => const AddItemScreen(),
        '/login': (context) => const LoginScreen(),
      },
    );
  }
}
