# Interpreter --> implements dc language syntax and runs checks before compiling to diff output formats

# DONE ✅ 
def parser_interpreter(overall_token_array:list[tuple]) -> (list[tuple]) | None:

    draft_charge_count:int = 0
    final_draft_charge_array:list[tuple] = []

    for token_array in overall_token_array:

        # print(token_array[1])

        draft_charge_count += 1

        # each of these is written to for each output, allowing output format to be specified in the end
        final_pdf:str = "" # for pdf output
        final_html:str = "" # for html output with included boilerplate
        final_txt:str = "" # for txt output
        final_md:str = "" # for md output
        final_rmd:str = "" # for rmd output
        final_docx:str = "" # for docx output

        vital_information_dict:dict = { "OUTPUT_FORMAT":"", 
                                        "SUSPECT_NAME":"", 
                                        "SUSPECT_NRIC":"", 
                                        "SUSPECT_RACE":"", 
                                        "SUSPECT_AGE":0, 
                                        "SUSPECT_GENDER":"", 
                                        "SUSPECT_NATIONALITY":"",
                                        "CHARGE_TITLE":"",
                                        "OFFENSE_DATE":"",
                                        "CHARGE_EXPLANATION":"",
                                        "STATUTE":"",
                                        "CHARGING_OFFICER":"",
                                        "ROLE_DIV":"",
                                        "CHARGING_DATE":""
                                    } # used to record important information
        match_stack:list[str]= [] # used to determine active stack of unmatched symbols
        suspect_info:str = ""
        charge_info:str = ""
        statute_info:str = ""
        charging_officer_info:str = ""

        for i in range(len(token_array[1])):

            # print(token_array[1][i])

            match token_array[1][i]["type"]:
                
# --------------------

                # DONE ✅ 
                # - should only occur once
                case "OUTPUT_FORMAT":

                    # print(vital_information_dict)

                    if vital_information_dict["OUTPUT_FORMAT"] != "" and "OUTPUT_FORMAT" not in match_stack:
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Multiple output formats provided. Please provide one only.")
                        return None

                    else:
                        if "OUTPUT_FORMAT" not in match_stack:
                            match_stack.append("OUTPUT_FORMAT") 
                            output_format:str= token_array[1][i+1]["value"]
                            match output_format:
                                case "PDF":
                                    vital_information_dict["OUTPUT_FORMAT"] = "PDF"
                                case "HTML":
                                    vital_information_dict["OUTPUT_FORMAT"] = "HTML"
                                case "TXT":
                                    vital_information_dict["OUTPUT_FORMAT"] = "TXT"
                                case "MD":
                                    vital_information_dict["OUTPUT_FORMAT"] = "MD"
                                case "DOCX":
                                    vital_information_dict["OUTPUT_FORMAT"] = "DOCX"
                                case "RMD":
                                    vital_information_dict["OUTPUT_FORMAT"] = "RMD"
                                case _:
                                    print(f"Unrecognised output format detected in Draft Charge {draft_charge_count}! DC currently supports one of the following [PDF/HTML/TXT/MD/RMD/DOCX].")
                                    return None
                            if token_array[1][i+2]["type"] == "OUTPUT_FORMAT":
                                pass
                            else:
                                print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched output format characters '`' found.")
                                return None
                        
                        elif "OUTPUT_FORMAT" in match_stack:
                            match_stack.remove("OUTPUT_FORMAT")

                        else:
                            print("Error Code 0001. Drop me a message on Github @gongahkia.")
                            return None

# --------------------

                # DONE ✅ 
                case "L_SUSPECT_INFO":
                    if vital_information_dict["SUSPECT_NAME"] != "" and vital_information_dict["SUSPECT_AGE"] != 0 and vital_information_dict["SUSPECT_RACE"] != "" and vital_information_dict["SUSPECT_GENDER"] != "" and vital_information_dict["SUSPECT_NRIC"] != "" and vital_information_dict["SUSPECT_NATIONALITY"] != "" and suspect_info != "": 
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Multiple instances of suspect information provided. Please provide one only.")
                        return None

                    else:

                        if "R_SUSPECT_INFO" not in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched suspect infromation character `<` found.")
                            return None

                        elif "R_SUSPECT_INFO" in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            match_stack.append("L_SUSPECT_INFO")

                        else:
                            print("Error Code 0005. Drop me a message on Github @gongahkia.")
                            return None

# --------------------

                # DONE ✅ 
                case "R_SUSPECT_INFO":

                    if "L_SUSPECT_INFO" not in [list(token.values())[0] for token in token_array[1][:i+1]]:
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched suspect information character `>` found.")
                        return None

                    elif "L_SUSPECT_INFO" in [list(token.values())[0] for token in token_array[1][:i+1]] and "L_SUSPECT_INFO" in match_stack:
                        match_stack.remove("L_SUSPECT_INFO")
                        # print(suspect_info)
                        
                        if len(suspect_info.split(";")) != 6:
                            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Wrong number of arguments provided for suspect information. Please provide 6, seperated by semicolons (;).")
                            return None

                        vital_information_dict["SUSPECT_NAME"] = suspect_info.split(";")[0]
                        vital_information_dict["SUSPECT_NRIC"] = suspect_info.split(";")[1]
                        vital_information_dict["SUSPECT_RACE"] = suspect_info.split(";")[2]

                        try:
                            vital_information_dict["SUSPECT_AGE"] = int(suspect_info.split(";")[3])
                        except:
                            print(f"Incorrect information detected in Draft Charge {draft_charge_count}. Please provide a valid integer value for suspect age.")
                            return None

                        vital_information_dict["SUSPECT_GENDER"] = suspect_info.split(";")[4]
                        vital_information_dict["SUSPECT_NATIONALITY"] = suspect_info.split(";")[5]

                    else:
                        print("Error Code 0011. Drop me a message on Github @gongahkia.")
                        return None

# --------------------

                # DONE ✅ 
                case "L_CHARGE_INFO":
                    if vital_information_dict["CHARGE_TITLE"] != "" and vital_information_dict["CHARGE_EXPLANATION"] != "" and vital_information_dict["OFFENSE_DATE"] != "" and charge_info != "":
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Multiple instances of charge information provided. Please provide one only.")
                        return None

                    else:
                        if "R_CHARGE_INFO" not in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched charge information character `[` found.")
                            return None

                        elif "R_CHARGE_INFO" in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            match_stack.append("L_CHARGE_INFO")

                        else:
                            print("Error Code 0007. Drop me a message on Github @gongahkia.")
                            return None

# --------------------

                # DONE ✅ 
                case "R_CHARGE_INFO":

                    if "L_CHARGE_INFO" not in [list(token.values())[0] for token in token_array[1][:i+1]]:
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched charge information character `]` found.")
                        return None

                    elif "L_CHARGE_INFO" in [list(token.values())[0] for token in token_array[1][:i+1]] and "L_CHARGE_INFO" in match_stack:
                        match_stack.remove("L_CHARGE_INFO")
                        # print(charge_info)
                        
                        if len(charge_info.split(";")) != 3:
                            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Wrong number of arguments provided for charge information. Please provide 3, seperated by semicolons (;).")
                            return None

                        vital_information_dict["CHARGE_TITLE"] = charge_info.split(";")[0]
                        vital_information_dict["CHARGE_EXPLANATION"] = charge_info.split(";")[2]

                        if not check_date_format(charge_info.split(";")[1]):
                            return None
                        else:
                            vital_information_dict["OFFENSE_DATE"] = create_date(charge_info.split(";")[1])
                    else:
                        print("Error Code 0006. Drop me a message on Github @gongahkia.")
                        return None

# --------------------

                # DONE ✅ 
                case "STATUTE_INFO":

                    if vital_information_dict["STATUTE"] != "" and "STATUTE_INFO" not in match_stack:
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Multiple statutes provided. Please provide one only.")
                        return None

                    else:
                        if "STATUTE_INFO" not in match_stack: # opening statute info character 
                            match_stack.append("STATUTE_INFO")     
                            # print([list(token.values())[0] for token in token_array[1][i+1:]])
                            if "STATUTE_INFO" not in [list(token.values())[0] for token in token_array[1][i+1:]]:
                                print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched statute information character '@' found.")
                                return None

                            else:
                                pass

                        elif "STATUTE_INFO" in match_stack: # closing statute info character
                            match_stack.remove("STATUTE_INFO")
                            # print(statute_info)
                            if len(statute_info) < 1:
                                print(f"Syntax error detected in Draft Charge {draft_charge_count}. No arguments were provided between the statute information characters '@'.")
                                return None
                            else:
                                vital_information_dict["STATUTE"] = statute_info

                        else:
                            print("Error Code 0010. Drop me a message on Github @gongahkia.")
                            return None

# --------------------

                # DONE ✅ 
                case "L_CHARGING_OFFICER_INFO":
                    if vital_information_dict["CHARGING_OFFICER"] != "" and vital_information_dict["CHARGING_DATE"] != "" and vital_information_dict["ROLE_DIV"] != "" and charging_officer_info != "":
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}. Multiple instances of charging officer information provided. Please provide one only.")
                        return None

                    else:
                        if "R_CHARGING_OFFICER_INFO" not in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            print(f"Syntax error detected in Draft Charge {draft_charge_count}.", end="")
                            print("Unmatched charging officer information character '{' found.")
                            return None

                        elif "R_CHARGING_OFFICER_INFO" in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            match_stack.append("L_CHARGING_OFFICER_INFO")

                        else:
                            print("Error Code 0008. Drop me a message on Github @gongahkia.")
                            return None

# --------------------

                # DONE ✅ 
                case "R_CHARGING_OFFICER_INFO":

                    if "R_CHARGING_OFFICER_INFO" not in [list(token.values())[0] for token in token_array[1][:i+1]]:
                        print(f"Syntax error detected in Draft Charge {draft_charge_count}.", end="")
                        print("Unmatched charging officer information character `}` found.")
                        return None

                    elif "L_CHARGING_OFFICER_INFO" in [list(token.values())[0] for token in token_array[1][:i+1]] and "L_CHARGING_OFFICER_INFO" in match_stack:
                        match_stack.remove("L_CHARGING_OFFICER_INFO")
                        # print(charging_officer_info)
                        
                        if len(charging_officer_info.split(";")) != 3:
                            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Wrong number of arguments provided for charging officer information. Please provide 3, seperated by semicolons (;).")
                            return None

                        vital_information_dict["CHARGING_OFFICER"] = charging_officer_info.split(";")[0]
                        vital_information_dict["ROLE_DIV"] = charging_officer_info.split(";")[1]

                        if not check_date_format(charging_officer_info.split(";")[2]):
                            return None 
                        else:
                            vital_information_dict["CHARGING_DATE"] = create_date(charging_officer_info.split(";")[2])

                    else:
                        print("Error Code 0009. Drop me a message on Github @gongahkia.")
                        return None

# --------------------

                # DONE ✅ 
                case "COMMENT":

                    if "COMMENT" not in match_stack: # opening comment character 
                        match_stack.append("COMMENT")     
                        # print([list(token.values())[0] for token in token_array[1][i+1:]])
                        if "COMMENT" not in [list(token.values())[0] for token in token_array[1][i+1:]]:
                            print(f"Syntax error detected in Draft Charge {draft_charge_count}. Unmatched comment character '#' found.")
                            return None

                        else:
                            pass

                    elif "COMMENT" in match_stack: # closing comment character
                        match_stack.remove("COMMENT")

                    else:
                        print("Error Code 0004. Drop me a message on Github @gongahkia.")
                        return None
                    pass

# --------------------

                case "WORD":
                    if "L_SUSPECT_INFO" in match_stack:
                        suspect_info += token_array[1][i]["value"] + " "
                    elif "L_CHARGE_INFO" in match_stack:
                        charge_info += token_array[1][i]["value"] + " "
                    elif "STATUTE_INFO" in match_stack:
                        statute_info += token_array[1][i]["value"] + " "
                    elif "L_CHARGING_OFFICER_INFO" in match_stack:
                        charging_officer_info += token_array[1][i]["value"] + " "
                    # elif blah blah
                        # add code here
                    pass

# --------------------

                # DONE ✅ 
                case _:
                    print("Error Code 0003. Drop me a message on @gongahkia.")

# --------------------

        # DONE ✅ 
        # checking for vital required suspect information for each draft charge 
        if vital_information_dict["SUSPECT_NAME"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect Name not provided. Please provide one.")
            return None
        elif vital_information_dict["SUSPECT_NRIC"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect NRIC not provided. Please provide one.")
            return None
        elif vital_information_dict["SUSPECT_RACE"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect Race not provided. Please provide one.")
            return None
        elif vital_information_dict["SUSPECT_AGE"] == 0:
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect Age not provided. Please provide one.")
            return None
        elif vital_information_dict["SUSPECT_GENDER"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect Gender not provided. Please provide one.")
            return None
        elif vital_information_dict["SUSPECT_NATIONALITY"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Suspect Nationality not provided. Please provide one.")
            return None

        # DONE ✅ 
        # checking for vital required charge information for each draft charge
        if vital_information_dict["CHARGE_TITLE"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Charge title not provided. Please provide one.")
            return None
        elif vital_information_dict["OFFENSE_DATE"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Date of offense not provided. Please provide one.")
            return None
        elif vital_information_dict["CHARGE_EXPLANATION"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Material facts of Charge not provided. Please provide them.")
            return None

        # DONE ✅ 
        # checking for vital required statute information for each draft charge
        if vital_information_dict["STATUTE"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Statute not provided. Please provide one.")
            return None

        # DONE ✅ 
        # checking for vital required charging officer information for each draft charge
        if vital_information_dict["CHARGING_OFFICER"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Charging Officer name not provided. Please provide one.")
            return None
        elif vital_information_dict["ROLE_DIV"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Charging Officer appointment and division not specified. Please provide them.")
            return None
        elif vital_information_dict["CHARGING_DATE"] == "":
            print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Date of Charge not specified. Please provide one.")
            return None

# --------------------

        # DONE ✅ 
        # checks for incomplete output format and formats respective file type
        match vital_information_dict["OUTPUT_FORMAT"]:
            case "PDF":
                final_pdf = pdf_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.rmd|PDF", final_pdf))
            case "HTML":
                final_html = html_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.html", final_html))
            # DONE ✅ 
            case "TXT":
                final_txt = txt_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.txt", final_txt))
            case "MD":
                final_md = md_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.md", final_md))
            case "RMD":
                final_rmd = rmd_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.rmd", final_rmd))
            case "DOCX":
                final_docx = docx_draft_charge_gen(vital_information_dict)
                final_draft_charge_array.append((f"{token_array[0]}-Draft-Charge-{draft_charge_count}.rmd|DOCX", final_docx))
            case "":
                print(f"Incomplete information detected in Draft Charge {draft_charge_count}. Output format not provided. Please provide one.")
                return None
            case _:
                print("Error Code 0002. Drop me a message on @gongahkia.")
                return None

        # print(vital_information_dict)

# --------------------
    
    # print(final_draft_charge_array)
    return final_draft_charge_array

# --------------------

# DONE ✅ 
def check_date_format(date:str) -> bool | None :
    try:
        day, month, year = map(int, date.split("/"))
        if day < 1 or day > 31 or month < 1 or month > 12 or year < 1:
            print(f"Syntax error detected in the date provided: {date}. Please adhere to the specified format of DD/MM/YYYY")
            return False
        else:
            return True
    except (ValueError, IndexError):
        print(f"Syntax error detected in the date provided: {date}. Please adhere to the specified format of DD/MM/YYYY and use integers for all values.")
        return False

# --------------------

# DONE ✅ 
def create_date(date:str) -> str | None:
    day:str= date.split("/")[0]
    year:str = date.split("/")[2]
    match int(date.split("/")[1]):
        case 1:
            month:str = "January"
        case 2:
            month = "February"
        case 3:
            month = "March"
        case 4:
            month = "April"
        case 5:
            month = "May"
        case 6:
            month = "June"
        case 7:
            month = "July"
        case 8:
            month = "August"
        case 9:
            month = "September"
        case 10:
            month = "October"
        case 11:
            month = "November"
        case 12:
            month = "December"
        case _:
            return None
    return f"{day} {month} {year}"

# --------------------

# DONE ✅ 
def rmd_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f'''
---
output: [edit accordingly]
---

# Criminal Procedure Code 2010
# (CHAPTER 68)
# REVISED EDITION 2012
# SECTIONS 123-125

# CHARGE

You, 

**Name:** {vital_information_dict["SUSPECT_NAME"]}
**NRIC:** {vital_information_dict["SUSPECT_NRIC"]}
**RACE:** {vital_information_dict["SUSPECT_RACE"]}
**AGE:** {vital_information_dict["SUSPECT_AGE"]}
**SEX:** {vital_information_dict["SUSPECT_GENDER"]}
**NATIONALITY:** {vital_information_dict["SUSPECT_NATIONALITY"]}

are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], *to wit* {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.

{vital_information_dict["CHARGING_OFFICER"]}
{vital_information_dict["ROLE_DIV"]}
{vital_information_dict["CHARGING_DATE"]}
                            '''
    return final_charge_txt

# DONE ✅ 
def pdf_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f'''
---
output: pdf_document
---

# Criminal Procedure Code 2010
# (CHAPTER 68)
# REVISED EDITION 2012
# SECTIONS 123-125

# CHARGE

You, 

**Name:** {vital_information_dict["SUSPECT_NAME"]}
**NRIC:** {vital_information_dict["SUSPECT_NRIC"]}
**RACE:** {vital_information_dict["SUSPECT_RACE"]}
**AGE:** {vital_information_dict["SUSPECT_AGE"]}
**SEX:** {vital_information_dict["SUSPECT_GENDER"]}
**NATIONALITY:** {vital_information_dict["SUSPECT_NATIONALITY"]}

are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], *to wit* {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.

{vital_information_dict["CHARGING_OFFICER"]}
{vital_information_dict["ROLE_DIV"]}
{vital_information_dict["CHARGING_DATE"]}
                            '''
    return final_charge_txt

# DONE ✅ 
def docx_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f'''
---
output: officedown::rdocx_document
---

# Criminal Procedure Code 2010
# (CHAPTER 68)
# REVISED EDITION 2012
# SECTIONS 123-125

# CHARGE

You, 

**Name:** {vital_information_dict["SUSPECT_NAME"]}
**NRIC:** {vital_information_dict["SUSPECT_NRIC"]}
**RACE:** {vital_information_dict["SUSPECT_RACE"]}
**AGE:** {vital_information_dict["SUSPECT_AGE"]}
**SEX:** {vital_information_dict["SUSPECT_GENDER"]}
**NATIONALITY:** {vital_information_dict["SUSPECT_NATIONALITY"]}

are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], *to wit* {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.

{vital_information_dict["CHARGING_OFFICER"]}
{vital_information_dict["ROLE_DIV"]}
{vital_information_dict["CHARGING_DATE"]}
                            '''
    return final_charge_txt

# DONE ✅ 
def txt_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f'''
Criminal Procedure Code 2010
(CHAPTER 68)
REVISED EDITION 2012
SECTIONS 123-125

CHARGE

You, 

Name: {vital_information_dict["SUSPECT_NAME"]}
NRIC: {vital_information_dict["SUSPECT_NRIC"]}
RACE: {vital_information_dict["SUSPECT_RACE"]}
AGE: {vital_information_dict["SUSPECT_AGE"]}
SEX: {vital_information_dict["SUSPECT_GENDER"]}
NATIONALITY: {vital_information_dict["SUSPECT_NATIONALITY"]}

are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], to wit {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.

{vital_information_dict["CHARGING_OFFICER"]}
{vital_information_dict["ROLE_DIV"]}
{vital_information_dict["CHARGING_DATE"]}
                            '''
    return final_charge_txt

# DONE ✅ 
def md_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f'''
<h2 align="center"><u>Criminal Procedure Code 2010</u></h2>
<h2 align="center"><u>(CHAPTER 68)</u></h2>
<h2 align="center"><u>REVISED EDITION 2012</u></h2>
<h2 align="center"><u>SECTIONS 123-125</u></h2>
<br>  
<h2 align="center"><u>CHARGE</u></h2>

You,  
<div align="center"><b>Name: {vital_information_dict["SUSPECT_NAME"]}</b></div>
<div align="center"><b>NRIC: {vital_information_dict["SUSPECT_NRIC"]}</b></div>
<div align="center"><b>RACE: {vital_information_dict["SUSPECT_RACE"]}</b></div>
<div align="center"><b>AGE: {vital_information_dict["SUSPECT_AGE"]}</b></div>
<div align="center"><b>SEX: {vital_information_dict["SUSPECT_GENDER"]}</b></div>
<div align="center"><b>NATIONALITY: {vital_information_dict["SUSPECT_NATIONALITY"]}</b></div>
<br>
are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], <i>to wit</i> {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.  
<br>  
<br>
{vital_information_dict["CHARGING_OFFICER"]}<br>
{vital_information_dict["ROLE_DIV"]}<br>
{vital_information_dict["CHARGING_DATE"]}
    '''
    return final_charge_txt

# DONE ✅ 
def html_draft_charge_gen(vital_information_dict:dict) -> str:
    final_charge_txt:str = f"""
<!DOCTYPE HTML>
<html>
<head>
    <title>Draft Charge</title>
    <meta charset='UTF-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
    <h2 align="center"><u>Criminal Procedure Code 2010</u></h2>
    <h2 align="center"><u>(CHAPTER 68)</u></h2>
    <h2 align="center"><u>REVISED EDITION 2012</u></h2>
    <h2 align="center"><u>SECTIONS 123-125</u></h2><br>
    <h2 align="center"><u>CHARGE</u></h2>

    <div>You,</div>
    <div align="center"><b>Name: {vital_information_dict["SUSPECT_NAME"]}</b></div>
    <div align="center"><b>NRIC: {vital_information_dict["SUSPECT_NRIC"]}</b></div>
    <div align="center"><b>RACE: {vital_information_dict["SUSPECT_RACE"]}</b></div>
    <div align="center"><b>AGE: {vital_information_dict["SUSPECT_AGE"]}</b></div>
    <div align="center"><b>SEX: {vital_information_dict["SUSPECT_GENDER"]}</b></div>
    <div align="center"><b>NATIONALITY: {vital_information_dict["SUSPECT_NATIONALITY"]}</b></div><br>

    <div>are charged that you, on (or about) {vital_information_dict["OFFENSE_DATE"]} at [location, add as necessary], Singapore, did [add brief summary of charge], <i>to wit</i> {vital_information_dict["CHARGE_EXPLANATION"]}, and you have thereby committed an offence under {vital_information_dict["STATUTE"]}.<br><br></div>

    <div>{vital_information_dict["CHARGING_OFFICER"]}</div>
    <div>{vital_information_dict["ROLE_DIV"]}</div>
    <div>{vital_information_dict["CHARGING_DATE"]}</div>
</body>
</html>
    """
    return final_charge_txt

