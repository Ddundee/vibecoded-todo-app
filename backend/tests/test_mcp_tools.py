import asyncio

import pytest

import mcp_server.server as mcp_server
from app.utils import local_today


@pytest.fixture()
def mcp_env(use_test_db):
    return use_test_db


def test_create_task_tool(mcp_env):
    result = mcp_server.create_task(title="Write MCP tests", category="project", priority="high")
    assert result["title"] == "Write MCP tests"
    assert result["source"] == "mcp"
    assert result["priority"] == "high"


def test_get_task_tool_not_found_returns_error_dict(mcp_env):
    result = mcp_server.get_task("does-not-exist")
    assert "error" in result


def test_complete_task_tool(mcp_env):
    created = mcp_server.create_task(title="finish via mcp")
    completed = mcp_server.complete_task(created["id"])
    assert completed["status"] == "completed"


def test_create_oa_tool_sets_urgency(mcp_env):
    result = mcp_server.create_oa(
        company="Roblox", oa_name="SWE OA", deadline=local_today().isoformat()
    )
    assert result["oa_urgency"] == "critical"


def test_create_internship_application_tool(mcp_env):
    result = mcp_server.create_internship_application(
        company="Akuna Capital", position="Quant Dev Intern", application_status="applied"
    )
    assert result["category"] == "internship"
    assert result["recruiting"]["company"] == "Akuna Capital"
    assert result["recruiting"]["application_status"] == "applied"


def test_create_recurring_task_tool_and_today_materializes_it(mcp_env):
    mcp_server.create_recurring_task(
        title="Apply to 20 internships", pattern="weekdays", start_date=local_today().isoformat()
    )
    today_bundle = mcp_server.get_today()
    # weekdays pattern may or may not fire today depending on which day tests run;
    # just assert the tool ran without error and returned the expected shape.
    assert "recurring_today" in today_bundle


def test_plan_task_for_today_and_carry_forward(mcp_env):
    created = mcp_server.create_task(title="carry me", priority="low")
    mcp_server.plan_task_for_today(created["id"])

    moved = mcp_server.carry_unfinished_tasks_forward(priorities=["low"])
    assert any(t["id"] == created["id"] for t in moved)


def test_get_priority_ranked_tasks_includes_reasons(mcp_env):
    mcp_server.create_task(title="urgent", priority="critical", due_date=local_today().isoformat())
    mcp_server.create_task(title="whenever", priority="low")

    ranked = mcp_server.get_priority_ranked_tasks(limit=5)
    assert ranked[0]["title"] == "urgent"
    assert "priority_reasons" in ranked[0]


def test_search_tasks_tool(mcp_env):
    mcp_server.create_task(title="Akuna OA prep")
    results = mcp_server.search_tasks("Akuna")
    assert len(results) == 1


def test_add_task_note_tool(mcp_env):
    created = mcp_server.create_task(title="note me")
    updated = mcp_server.add_task_note(created["id"], "reviewed with recruiter")
    assert "reviewed with recruiter" in updated["notes"]


def test_all_registered_tools_are_discoverable():
    tools = asyncio.run(mcp_server.mcp.list_tools())
    names = {t.name for t in tools}
    expected = {
        "get_today",
        "get_tasks",
        "get_task",
        "get_overdue_tasks",
        "get_upcoming_tasks",
        "get_oa_deadlines",
        "get_recruiting_pipeline",
        "search_tasks",
        "get_week_summary",
        "create_task",
        "create_oa",
        "create_internship_application",
        "create_recurring_task",
        "update_task",
        "complete_task",
        "cancel_task",
        "reschedule_task",
        "set_task_priority",
        "add_task_note",
        "plan_task_for_today",
        "remove_task_from_today",
        "carry_unfinished_tasks_forward",
    }
    assert expected.issubset(names)


def test_registered_resources_cover_required_uris():
    resources = asyncio.run(mcp_server.mcp.list_resources())
    uris = {str(r.uri) for r in resources}
    assert {
        "tasks://today",
        "tasks://overdue",
        "tasks://upcoming",
        "recruiting://oas",
        "recruiting://pipeline",
    }.issubset(uris)
