# === NEW VERSION v1.0.2 ===

import os
import shutil
import subprocess
import uuid

DEFAULT_1CV8 = r"D:\1cv8\8.3.18.1334\bin\1cv8.exe"
DEFAULT_WEBINST = r"D:\1cv8\8.3.18.1334\bin\webinst.exe"
SOURCE_1CD = r"D:\Organization.bases\template2\1Cv8.1CD"
BASAR_DIR_ROOT = r"D:\Organization.bases"
WWW_ROOT = r"C:\inetpub\wwwroot"


def initialize_1c_database(org_name):
    unique_id = uuid.uuid4().hex[:8]
    folder_name = f"{org_name}-{unique_id}"

    base_dir = os.path.join(BASAR_DIR_ROOT, folder_name)
    www_dir = os.path.join(WWW_ROOT, folder_name)
    source_1cd = SOURCE_1CD
    onecv8 = DEFAULT_1CV8
    webinst = DEFAULT_WEBINST

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

    cmd_publish = [
        webinst, "-publish", "-iis",
        "-wsdir", folder_name,
        "-dir", www_dir,
        "-connstr", f"File='{base_dir}';"
    ]

    result = subprocess.run(cmd_publish, timeout=300, capture_output=True, text=True)
    output = (result.stdout + result.stderr).lower()

    return f"http://localhost/{folder_name}/"


# === 1C Update Config v1.0.01 === 
ONEC_EXE = r"D:\1cv8\8.3.18.1334\bin\1cv8.exe"
CF_FILE = r"D:\Organization.bases\1Cv8.cf"

def update_1c_config(base_path: str) -> dict:
    """
    Обновляет конфигурацию 1С.
    : param base_path: обновляемый базовый путь
    в: Return: dict {'success': bool, 'message': STR}
    """
    log_file = os.path.join(base_path, "load_log.txt")
    print("base_path:", base_path)
    command = [
        ONEC_EXE,
        'DESIGNER',
        f'/F{base_path}',
        '/LoadCfg', CF_FILE, #LoadCfg
        '/UpdateDBCfg',
        # '/C',
        '/DisableStartupMessages',
        '/DisableStartupDialogs',
        # '/AutoStart',
        '/Out', log_file,
        '/N', '', #Admin
        '/P', '', #91281
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
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        if result.returncode == 0:
            return {"success": True, "message": "Конфигурация успешно обновлена!"}
        else:
            error_msg = result.stderr or f"Код состояния: {result.returncode}"
            return {"success": False, "message": error_msg}

    except subprocess.TimeoutExpired:
        return {"success": False, "message": "Время истекло-операция заняла более 5 минут"}
    except Exception as e:
        return {"success": False, "message": f"Ошибка: {e}"}
    

# === OLD VERSION v1.0.1 ===

# import os
# import shutil
# import subprocess

# DEFAULT_1CV8 = r"D:\1cv8\8.3.18.1334\bin\1cv8.exe"
# DEFAULT_WEBINST = r"D:\1cv8\8.3.18.1334\bin\webinst.exe"
# DEFAULT_CF = r"D:\1C\3333333333.cf"
# BASAR_DIR_ROOT = r"D:\Bazalar"
# WWW_ROOT = r"C:\inetpub\wwwroot"

# def create_and_publish_1c(org_name):
#     base_dir = os.path.join(BASAR_DIR_ROOT, org_name)
#     www_dir = os.path.join(WWW_ROOT, org_name)
#     cf_path = DEFAULT_CF
#     onecv8 = DEFAULT_1CV8
#     webinst = DEFAULT_WEBINST

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
