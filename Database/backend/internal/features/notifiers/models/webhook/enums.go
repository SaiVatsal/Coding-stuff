package webhook_notifier

type WebhookMethod string

const (
	WebhookMethodPOST WebhookMethod = "POST"
	WebhookMethodGET  WebhookMethod = "GET"
)
