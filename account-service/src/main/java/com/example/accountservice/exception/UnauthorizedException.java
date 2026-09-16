package com.example.accountservice.exception;

// Deliberately kept separate from the rest of the app's error handling
// (which has no exception handler and falls through to bare 500s). Auth
// failures need a real 401 so clients can tell "bad credentials" apart from
// "server broke" - see AccountController's local @ExceptionHandler.
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
