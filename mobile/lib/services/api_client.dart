import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic data;

  ApiException({required this.statusCode, required this.message, this.data});

  @override
  String toString() => 'ApiException [$statusCode]: $message';
}

class ApiClient {
  static String baseUrl = 'http://localhost:8000/api/v1';
  static String? _authToken;
  static VoidCallback? onUnauthorized;

  static void setAuthToken(String? token) {
    _authToken = token;
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  static Future<dynamic> get(String endpoint, {int retries = 2}) async {
    return _requestWithRetry('GET', endpoint, retries: retries);
  }

  static Future<dynamic> post(String endpoint, {Map<String, dynamic>? body, int retries = 1}) async {
    return _requestWithRetry('POST', endpoint, body: body, retries: retries);
  }

  static Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    return _requestWithRetry('PUT', endpoint, body: body);
  }

  static Future<dynamic> delete(String endpoint) async {
    return _requestWithRetry('DELETE', endpoint);
  }

  static Future<dynamic> _requestWithRetry(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    int retries = 1,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    int attempts = 0;

    while (attempts <= retries) {
      attempts++;
      try {
        http.Response response;
        final jsonBody = body != null ? jsonEncode(body) : null;

        if (method == 'GET') {
          response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 10));
        } else if (method == 'POST') {
          response = await http.post(uri, headers: _headers, body: jsonBody).timeout(const Duration(seconds: 10));
        } else if (method == 'PUT') {
          response = await http.put(uri, headers: _headers, body: jsonBody).timeout(const Duration(seconds: 10));
        } else {
          response = await http.delete(uri, headers: _headers).timeout(const Duration(seconds: 10));
        }

        return _handleResponse(response);
      } on ApiException catch (e) {
        if (e.statusCode == 401 || e.statusCode == 403) {
          onUnauthorized?.call();
          rethrow;
        }
        if (attempts > retries) rethrow;
      } catch (e) {
        if (attempts > retries) {
          throw ApiException(
            statusCode: 503,
            message: 'Network error or timeout connecting to GramOne server: ${e.toString()}',
          );
        }
      }
    }
  }

  static dynamic _handleResponse(http.Response response) {
    dynamic jsonRes;
    try {
      jsonRes = jsonDecode(response.body);
    } catch (_) {
      jsonRes = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonRes;
    }

    final message = (jsonRes is Map && jsonRes.containsKey('detail'))
        ? jsonRes['detail'].toString()
        : 'Server error with status code ${response.statusCode}';

    if (response.statusCode == 401 || response.statusCode == 403) {
      onUnauthorized?.call();
    }

    throw ApiException(
      statusCode: response.statusCode,
      message: message,
      data: jsonRes,
    );
  }
}
