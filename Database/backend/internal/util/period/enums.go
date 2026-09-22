package period

import "time"

type TimePeriod string

const (
	PeriodDay     TimePeriod = "DAY"
	PeriodWeek    TimePeriod = "WEEK"
	PeriodMonth   TimePeriod = "MONTH"
	Period3Month  TimePeriod = "3_MONTH"
	Period6Month  TimePeriod = "6_MONTH"
	PeriodYear    TimePeriod = "YEAR"
	Period2Years  TimePeriod = "2_YEARS"
	Period3Years  TimePeriod = "3_YEARS"
	Period4Years  TimePeriod = "4_YEARS"
	Period5Years  TimePeriod = "5_YEARS"
	PeriodForever TimePeriod = "FOREVER"
)

// ToDuration converts Period to time.Duration
func (p TimePeriod) ToDuration() time.Duration {
	switch p {
	case PeriodDay:
		return 24 * time.Hour
	case PeriodWeek:
		return 7 * 24 * time.Hour
	case PeriodMonth:
		return 30 * 24 * time.Hour
	case Period3Month:
		return 90 * 24 * time.Hour
	case Period6Month:
		return 180 * 24 * time.Hour
	case PeriodYear:
		return 365 * 24 * time.Hour
	case Period2Years:
		return 2 * 365 * 24 * time.Hour
	case Period3Years:
		return 3 * 365 * 24 * time.Hour
	case Period4Years:
		return 4 * 365 * 24 * time.Hour
	case Period5Years:
		return 5 * 365 * 24 * time.Hour
	case PeriodForever:
		return 0
	default:
		panic("unknown period: " + string(p))
	}
}

// CompareTo compares this period with another and returns:
// -1 if p < other
//
//	0 if p == other
//	1 if p > other
//
// FOREVER is treated as the longest period
func (p TimePeriod) CompareTo(other TimePeriod) int {
	if p == other {
		return 0
	}

	d1 := p.ToDuration()
	d2 := other.ToDuration()

	// FOREVER has duration 0, but should be treated as longest period
	if p == PeriodForever {
		return 1
	}
	if other == PeriodForever {
		return -1
	}

	if d1 < d2 {
		return -1
	}
	if d1 > d2 {
		return 1
	}

	return 0
}
