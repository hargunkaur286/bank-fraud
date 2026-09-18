package com.example.accountservice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.accountservice.dto.AccountResponse;
import com.example.accountservice.dto.CreateAccountRequest;
import com.example.accountservice.dto.LoginRequest;
import com.example.accountservice.dto.LoginResponse;
import com.example.accountservice.entity.Account;
import com.example.accountservice.entity.AccountStatus;
import com.example.accountservice.entity.AccountType;
import com.example.accountservice.exception.BadRequestException;
import com.example.accountservice.exception.ConflictException;
import com.example.accountservice.exception.NotFoundException;
import com.example.accountservice.exception.UnauthorizedException;
import com.example.accountservice.repository.AccountRepository;

/**
 * Unit tests for AccountService, isolated from Spring, MySQL, and Kafka via
 * Mockito - these run in well under a second and are what a CI pipeline
 * actually runs on every push. See AccountFlowIntegrationTest-equivalents in
 * transaction-service for the Testcontainers-backed version of this idea.
 */
@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private TokenService tokenService;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(accountRepository, passwordEncoder, tokenService);
    }

    private CreateAccountRequest newAccountRequest() {
        return new CreateAccountRequest(
                "Ada Lovelace",
                "ada@example.com",
                "9990001111",
                "correcthorse123",
                AccountType.SAVINGS,
                new BigDecimal("10000")
        );
    }

    @Test
    void createAccount_hashesPasswordAndSavesAccount() {
        CreateAccountRequest request = newAccountRequest();
        when(accountRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(accountRepository.existsByAccountNumber(any())).thenReturn(false);
        when(passwordEncoder.encode("correcthorse123")).thenReturn("hashed-password");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        AccountResponse response = accountService.createAccount(request);

        assertThat(response.getEmail()).isEqualTo("ada@example.com");
        assertThat(response.getBalance()).isEqualByComparingTo("10000");
        assertThat(response.getAccountNumber()).hasSize(12);

        verify(accountRepository).save(argThatPasswordIsHashed());
    }

    private Account argThatPasswordIsHashed() {
        return org.mockito.ArgumentMatchers.argThat(account ->
                "hashed-password".equals(account.getPassword())
        );
    }

    @Test
    void createAccount_duplicateEmail_throwsConflict() {
        CreateAccountRequest request = newAccountRequest();
        when(accountRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> accountService.createAccount(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("ada@example.com");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void login_correctPassword_returnsTokenAndAccount() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        when(accountRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("correcthorse123", "hashed-password")).thenReturn(true);
        when(tokenService.generateToken(account.getAccountNumber())).thenReturn("a.jwt.token");

        LoginResponse response = accountService.login(new LoginRequest("ada@example.com", "correcthorse123"));

        assertThat(response.getToken()).isEqualTo("a.jwt.token");
        assertThat(response.getAccount().getAccountNumber()).isEqualTo(account.getAccountNumber());
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        when(accountRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> accountService.login(new LoginRequest("ada@example.com", "wrong-password")))
                .isInstanceOf(UnauthorizedException.class);

        verify(tokenService, never()).generateToken(any());
    }

    @Test
    void login_accountPredatesLogin_throwsUnauthorizedWithClearMessage() {
        Account account = activeAccountWithHashedPassword(null);
        when(accountRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> accountService.login(new LoginRequest("ada@example.com", "anything")))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("predates login");
    }

    @Test
    void login_unknownEmail_throwsUnauthorized() {
        when(accountRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.login(new LoginRequest("ghost@example.com", "anything")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void deductBalance_insufficientFunds_throwsBadRequest() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        account.setBalance(new BigDecimal("50"));
        when(accountRepository.findByAccountNumber(account.getAccountNumber())).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> accountService.deductBalance(account.getAccountNumber(), new BigDecimal("100")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient funds");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void deductBalance_blockedAccount_throwsBadRequest() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        account.setStatus(AccountStatus.BLOCKED);
        when(accountRepository.findByAccountNumber(account.getAccountNumber())).thenReturn(Optional.of(account));

        assertThatThrownBy(() -> accountService.deductBalance(account.getAccountNumber(), new BigDecimal("10")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not active");
    }

    @Test
    void deductBalance_sufficientFunds_subtractsAndSaves() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        account.setBalance(new BigDecimal("100"));
        when(accountRepository.findByAccountNumber(account.getAccountNumber())).thenReturn(Optional.of(account));

        accountService.deductBalance(account.getAccountNumber(), new BigDecimal("40"));

        assertThat(account.getBalance()).isEqualByComparingTo("60");
        verify(accountRepository).save(account);
    }

    @Test
    void creditBalance_addsToBalance() {
        Account account = activeAccountWithHashedPassword("hashed-password");
        account.setBalance(new BigDecimal("100"));
        when(accountRepository.findByAccountNumber(account.getAccountNumber())).thenReturn(Optional.of(account));

        accountService.creditBalance(account.getAccountNumber(), new BigDecimal("25"));

        assertThat(account.getBalance()).isEqualByComparingTo("125");
    }

    @Test
    void blockAccount_notFound_throwsNotFound() {
        when(accountRepository.findByAccountNumber("000000000000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.blockAccount("000000000000"))
                .isInstanceOf(NotFoundException.class);
    }

    private Account activeAccountWithHashedPassword(String hashedPassword) {
        Account account = new Account();
        account.setId("id-1");
        account.setAccountNumber("100000000001");
        account.setAccountHolderName("Ada Lovelace");
        account.setEmail("ada@example.com");
        account.setPhone("9990001111");
        account.setAccountType(AccountType.SAVINGS);
        account.setStatus(AccountStatus.ACTIVE);
        account.setBalance(new BigDecimal("10000"));
        account.setDailyTransactionLimit(new BigDecimal("1000000"));
        account.setPassword(hashedPassword);
        return account;
    }
}
