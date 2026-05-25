# Statistical Treatment

## Purpose

This section presents the statistical treatment used to analyze the data gathered for **LYDO Connect: A Progressive Web Application for Information, Participation, and Transparency for Local Youth Development Offices**. The analysis covers responses from user-side post-survey questionnaires and admin/expert evaluation questionnaires.

## Data Sources

The statistical analysis will use the following data:

1. Respondent profile data (e.g., age group, sex, respondent type where applicable).
2. User post-survey Likert-scale responses.
3. Expert/admin Likert-scale responses based on ISO/IEC 25010 quality characteristics.
4. Open-ended comments for qualitative support.

## Statistical Tools and Techniques

### 1. Frequency and Percentage Distribution

Frequency and percentage will be used to summarize respondent profile data and categorical responses.

Formulas:

- Frequency: count of responses per category
- Percentage:

```text
Percentage (%) = (f / N) x 100
```

Where:
- `f` = frequency of a category
- `N` = total number of respondents

### 2. Weighted Mean

Weighted mean will be used to determine the average level of agreement for each survey statement and for each criterion/domain.

Formula:

```text
Weighted Mean (WM) = (Σ(f * w)) / N
```

Where:
- `f` = frequency of responses per rating
- `w` = weight of the rating (5, 4, 3, 2, 1)
- `N` = total number of responses for the item

### 3. Composite Mean

Composite mean will be used to summarize the average score per section (e.g., Information Quality, System Quality, Service Quality, and ISO/IEC 25010 sub-characteristics).

Formula:

```text
Composite Mean (CM) = (Σ item weighted means) / k
```

Where:
- `k` = number of items in the section

### 4. Standard Deviation (Optional but Recommended)

Standard deviation may be used to measure response consistency and variability for each section.

Formula:

```text
SD = sqrt(Σ(x - x̄)^2 / N)
```

Where:
- `x` = individual response value
- `x̄` = mean score
- `N` = number of responses

## Likert Scale and Verbal Interpretation

The study uses a 5-point Likert scale:

- 5 = Strongly Agree
- 4 = Agree
- 3 = Neutral
- 2 = Disagree
- 1 = Strongly Disagree

Suggested interpretation guide:

| Weighted Mean Range | Verbal Interpretation |
|---|---|
| 4.21 - 5.00 | Highly Acceptable / Excellent |
| 3.41 - 4.20 | Acceptable / Very Good |
| 2.61 - 3.40 | Moderately Acceptable / Good |
| 1.81 - 2.60 | Needs Improvement / Fair |
| 1.00 - 1.80 | Not Acceptable / Poor |

## Treatment by Instrument

### A. User Post-Survey

For user-side evaluation:

1. Compute item-level weighted mean.
2. Compute section-level composite mean:
- Information Quality
- System Quality
- Service Quality
- Post-Use Behavior
- User Satisfaction
3. Rank sections/items from highest to lowest mean to identify strengths and weak points.

### B. Expert/Admin Evaluation (ISO/IEC 25010-Aligned)

For expert/admin evaluation:

1. Compute item-level weighted mean for all criteria.
2. Compute composite mean per quality domain:
- Functional Suitability
- Performance Efficiency
- Compatibility
- Interaction Capability
- Reliability
- Security
- Maintainability
- Flexibility
- Safety
3. Derive an overall grand mean across domains.
4. Use ranking to identify highest-performing and lowest-performing quality areas.

## Qualitative Treatment

Open-ended responses will be analyzed using thematic coding:

1. Group similar comments into recurring themes.
2. Tag each theme as strength, issue, or recommendation.
3. Use themes to explain and support quantitative findings.

## Decision Basis

The system will be considered acceptable if:

1. Section/domain means fall within the **Acceptable** or **Highly Acceptable** range.
2. No critical quality area is rated in **Needs Improvement** or **Not Acceptable** range without a mitigation plan.
3. Qualitative feedback does not indicate unresolved critical usability, reliability, or security concerns.

## Data Presentation

Results will be presented using:

1. Frequency and percentage tables for respondent profiles.
2. Weighted mean and composite mean tables per section/domain.
3. Ranking tables for priority improvements.
4. Narrative summary integrating quantitative and qualitative findings.
