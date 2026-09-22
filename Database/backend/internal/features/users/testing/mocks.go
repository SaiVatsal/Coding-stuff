package users_testing

import "errors"

type MockEmailSender struct {
	SentEmails []EmailCall
	ShouldFail bool
}

type EmailCall struct {
	To      string
	Subject string
	Body    string
}

func NewMockEmailSender() *MockEmailSender {
	return &MockEmailSender{
		SentEmails: []EmailCall{},
		ShouldFail: false,
	}
}

func (m *MockEmailSender) SendEmail(to, subject, body string) error {
	m.SentEmails = append(m.SentEmails, EmailCall{
		To:      to,
		Subject: subject,
		Body:    body,
	})
	if m.ShouldFail {
		return errors.New("mock email send failure")
	}
	return nil
}
