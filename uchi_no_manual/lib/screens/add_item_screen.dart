import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uchi_no_manual/models/item.dart';
import 'package:uchi_no_manual/services/firestore_service.dart';
import 'package:uchi_no_manual/services/storage_service.dart';

class AddItemScreen extends StatefulWidget {
  const AddItemScreen({super.key});

  @override
  State<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends State<AddItemScreen> {
  final _itemNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  File? _image;

  final _firestoreService = FirestoreService();
  final _storageService = StorageService();

  bool _isSaving = false;

  Future<void> _pickImage() async {
    final pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveItem() async {
    if (_itemNameController.text.isEmpty || _descriptionController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('すべてのフィールドを入力してください')),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      String? imageUrl;
      if (_image != null) {
        imageUrl = await _storageService.uploadImage(_image!);
      }

      final newItem = Item(
        id: 'temp-id', // Firestore will generate this
        itemName: _itemNameController.text,
        description: _descriptionController.text,
        imageUrl: imageUrl,
      );

      await _firestoreService.addItem(newItem);

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('保存に失敗しました: $e')),
      );
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('備品を登録'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            children: [
              TextField(
                controller: _itemNameController,
                decoration: const InputDecoration(
                  labelText: '備品名',
                ),
              ),
              const SizedBox(height: 16.0),
              TextField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: '説明',
                ),
                maxLines: 5,
              ),
              const SizedBox(height: 16.0),
              _image != null
                  ? Image.file(_image!)
                  : const Text('画像が選択されていません'),
              TextButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image),
                label: const Text('画像を選択'),
              ),
              const SizedBox(height: 16.0),
              if (_isSaving)
                const CircularProgressIndicator()
              else
                ElevatedButton(
                  onPressed: _saveItem,
                  child: const Text('登録'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
