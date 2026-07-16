# === NEW VERSION v1.0.2 ===

from decouple import config
import os, shutil, subprocess, uuid, time

ONEC_EXE = config('ONEC_EXE')
WEBINST = config('WEBINST')
SOURCE_1CD = config('SOURCE_1CD')
BASAR_DIR_ROOT = config('BASAR_DIR_ROOT')
WWW_ROOT = config('WWW_ROOT')

def fix_web_config(www_dir):
    web_config_path = os.path.join(www_dir, "web.config")

    if not os.path.exists(web_config_path):
        return

    with open(web_config_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "requestPathInvalidCharacters" in content:
        return

    runtime_line = '<httpRuntime requestPathInvalidCharacters="" requestValidationMode="2.0" />'

    if "<system.web>" in content:
        content = content.replace(
            "<system.web>",
            "<system.web>\n    " + runtime_line
        )
    else:
        insert_block = f"""
        <system.web>
            {runtime_line}
        </system.web>
        """
        content = content.replace(
            "</configuration>",
            insert_block + "\n</configuration>"
        )

    with open(web_config_path, "w", encoding="utf-8") as f:
        f.write(content)


def initialize_1c_database(org_name, tariff_plan, source_1cd=None):
    unique_id = uuid.uuid4().hex[:8]
    folder_name = f"{org_name}-{unique_id}"

    base_dir = os.path.join(BASAR_DIR_ROOT, folder_name)
    www_dir = os.path.join(WWW_ROOT, folder_name)
    
    if source_1cd is None:
        source_1cd = SOURCE_1CD

    onecv8 = ONEC_EXE
    webinst = WEBINST

    os.makedirs(base_dir, exist_ok=True)
    os.makedirs(www_dir, exist_ok=True)

    target_1cd = os.path.join(base_dir, "1Cv8.1CD")
    shutil.copy2(source_1cd, target_1cd)

    # Этот блок используется для проверки и инициализации базы 1С после копирования из шаблона.
    # Он запускает 1С в режиме конфигуратора (DESIGNER), чтобы убедиться, что база открывается без ошибок.
    # /F{base_dir} – открывает файловую базу данных по указанному пути.
    # /N и /P – логин и пароль (здесь оставлены пустыми).
    # /C "Version" – выполняет простую команду для инициализации базы.
    # /DisableStartupDialogs и /DisableStartupMessages – отключают всплывающие окна для автоматизации.
    # Command to run 1C:Enterprise in DESIGNER mode
    # cmd_test = [
    #     onecv8,
    #     "DESIGNER",
    #     f"/F{base_dir}",
    #     "/N", "",
    #     "/P", "",
    #     "/C", "Version",
    #     "/DisableStartupDialogs",
    #     "/DisableStartupMessages"
    # ]
    # try:
    #     subprocess.run(cmd_test, timeout=30, capture_output=True)
    # except subprocess.TimeoutExpired:
    #     pass  

    plan_file_path = os.path.join(base_dir, "plan.txt")
    with open(plan_file_path, 'w', encoding='utf-8') as plan_file:
        plan_file.write(tariff_plan.lower()) 

    cmd_publish = [
        webinst, "-publish", "-iis",    
        "-wsdir", folder_name,
        "-dir", www_dir,
        "-connstr", f"File='{base_dir}';"
    ]

    result = subprocess.run(cmd_publish, timeout=300, capture_output=True, text=True)
    output = (result.stdout + result.stderr).lower()

    time.sleep(2)  
    fix_web_config(www_dir)

    host_url = config("HOST_URL")

    return f"{host_url}/{folder_name}/"


# === 1C Update Config v1.0.01 === 
ONEC_EXE = config("ONEC_EXE")
CF_FILE = config("CF_FILE")


def update_1c_config(base_path: str, cf_file: str = None) -> dict:
    log_file = os.path.join(base_path, "load_log.txt")

    cfg_path = cf_file if cf_file else CF_FILE

    command = [
        ONEC_EXE,
        "DESIGNER",
        f"/F{base_path}",
        "/LoadCfg", cfg_path,
        "/UpdateDBCfg",
        "/DisableStartupMessages",
        "/DisableStartupDialogs",
        "/Out", log_file,
        "/N", "",
        "/P", "",
    ]

    try:
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300,
            startupinfo=startupinfo,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )

        log_content = ""

        if os.path.exists(log_file):
            with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                log_content = f.read().lower()

        # ---------------- SUCCESS ----------------

        success_patterns = [
            "configuration successfully updated",
            "конфигурация успешно обновлена",
            "accepting changes",
        ]

        if any(x in log_content for x in success_patterns):
            return {
                "success": True,
                "message": "Конфигурация успешно обновлена."
            }

        # ---------------- DATABASE BUSY ----------------

        if any(x in log_content for x in [
            "монопольно",
            "exclusive",
            "занята",
            "database is locked",
        ]):
            return {
                "success": False,
                "code": "database_busy",
                "message": (
                    "Не удалось выполнить обновление.\n\n"
                    "Возможные причины:\n"
                    "• база данных используется другими пользователями;\n"
                    "• база открыта в режиме Конфигуратора;\n"
                    "• попробуйте выполнить обновление позже."
                )
            }

        # ---------------- HTTP CLIENTS ----------------

        if "clients that run over http are connected" in log_content:
            return {
                "success": False,
                "code": "http_clients",
                "message": (
                    "Не удалось выполнить обновление.\n\n"
                    "В базе есть активные пользователи, работающие через веб-клиент.\n"
                    "Попросите всех пользователей выйти из системы и повторите попытку."
                )
            }

        # ---------------- READ ONLY ----------------

        if "read-only" in log_content or "только для чтения" in log_content:
            return {
                "success": False,
                "code": "readonly",
                "message": (
                    "Конфигурация доступна только для чтения.\n"
                    "Проверьте подключение к хранилищу конфигурации."
                )
            }

        # ---------------- REPOSITORY ----------------

        if "repository" in log_content or "хранилищу конфигурации" in log_content:
            return {
                "success": False,
                "code": "repository",
                "message": (
                    "Не удалось подключиться к хранилищу конфигурации."
                )
            }

        # ---------------- FILE NOT FOUND ----------------

        if "cannot find" in log_content or "не найден" in log_content:
            return {
                "success": False,
                "code": "not_found",
                "message": (
                    "Не удалось найти файл конфигурации или информационную базу.\n"
                    "Проверьте настройки пути."
                )
            }

        # ---------------- ACCESS DENIED ----------------

        if "access is denied" in log_content or "отказано в доступе" in log_content:
            return {
                "success": False,
                "code": "access_denied",
                "message": (
                    "Недостаточно прав для выполнения обновления.\n"
                    "Запустите службу с необходимыми правами."
                )
            }

        # ---------------- DEFAULT ----------------

        return {
            "success": False,
            "code": "unknown",
            "message": (
                "Не удалось обновить конфигурацию.\n\n"
                "Проверьте следующее:\n"
                "• информационная база доступна;\n"
                "• база не открыта в Конфигураторе;\n"
                "• все пользователи вышли из базы;\n"
                "• веб-клиенты отключены;\n"
                "• служба имеет необходимые права.\n\n"
                f"Код завершения: {result.returncode}"
            ),
            "stderr": result.stderr,
            "stdout": result.stdout,
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "code": "timeout",
            "message": (
                "Время ожидания истекло.\n"
                "Обновление заняло более 5 минут."
            ),
        }

    except Exception as e:
        return {
            "success": False,
            "code": "exception",
            "message": f"Ошибка: {e}",
        }
    

# === OLD VERSION v1.0.1 ===

# import os
# import shutil
# import subprocess

# ONEC_EXE = r"D:\1cv8\8.3.18.1334\bin\1cv8.exe"
# WEBINST = r"D:\1cv8\8.3.18.1334\bin\webinst.exe"
# DEFAULT_CF = r"D:\1C\3333333333.cf"
# BASAR_DIR_ROOT = r"D:\Bazalar"
# WWW_ROOT = r"C:\inetpub\wwwroot"

# def create_and_publish_1c(org_name):
#     base_dir = os.path.join(BASAR_DIR_ROOT, org_name)
#     www_dir = os.path.join(WWW_ROOT, org_name)
#     cf_path = DEFAULT_CF
#     onecv8 = ONEC_EXE
#     webinst = WEBINST

#     os.makedirs(base_dir, exist_ok=True)
#     os.makedirs(www_dir, exist_ok=True)

#     target_cf = os.path.join(base_dir, os.path.basename(cf_path))
#     shutil.copy2(cf_path, target_cf)

#     cmd_create = [onecv8, "CREATEINFOBASE", f"File={base_dir};", "/UseTemplate", target_cf]
#     subprocess.run(cmd_create, timeout=600)

#     cmd_loadcfg = [
#         onecv8, "DESIGNER", "/F", base_dir,
#         "/LoadConfigFromFile", cf_path,
#         "/UpdateDBCfg",
#         "/DisableStartupDialogs", "/DisableStartupMessages"
#     ]
#     subprocess.run(cmd_loadcfg, timeout=600)

#     cmd_publish = [
#         webinst, "-publish", "-iis",
#         "-wsdir", org_name,
#         "-dir", www_dir,
#         "-connstr", f"File='{base_dir}';"
#     ]
#     subprocess.run(cmd_publish, timeout=600)

#     return f"http://localhost/{org_name}/"
