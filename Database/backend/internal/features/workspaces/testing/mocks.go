package workspaces_testing

import "errors"

type MockEmailSender struct {
	SendEmailCalls []EmailCall
	ShouldFail     bool
}

type EmailCall struct {
	To      string
	Subject string
	Body    string
}

func NewMockEmailSender() *MockEmailSender {
	return &MockEmailSender{
		SendEmailCalls: []EmailCall{},
		ShouldFail:     false,
	}
}

func (m *MockEmailSender) SendEmail(to, subject, body string) error {
	m.SendEmailCalls = append(m.SendEmailCalls, EmailCall{
		To:      to,
		Subject: subject,
		Body:    body,
	})
	if m.ShouldFail {
		return errors.New("mock email send failure")
	}
	return nil
}
