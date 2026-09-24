from .exception_handling import Rule as ExceptionHandlingRule
from .invoke_workflow_required import Rule as InvokeWorkflowRequiredRule
from .max_activities import Rule as MaxActivitiesRule
from .no_hardcoded_credentials import Rule as NoHardcodedCredentialsRule
from .output_schema import Rule as OutputSchemaRule
from .reframework_required import Rule as REFrameworkRequiredRule
from .selector_quality import Rule as SelectorQualityRule
from .structured_logs import Rule as StructuredLogsRule

RULE_REGISTRY = {
    rule.key: rule
    for rule in [
        MaxActivitiesRule(),
        REFrameworkRequiredRule(),
        NoHardcodedCredentialsRule(),
        StructuredLogsRule(),
        InvokeWorkflowRequiredRule(),
        ExceptionHandlingRule(),
        SelectorQualityRule(),
        OutputSchemaRule(),
    ]
}
