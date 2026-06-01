import os
import lexer as lx
import interpreter as inter

# --- 

# DONE ✅ 
def debug_print_original():
    fhand = open(f"../samples/sample1.dc", "r")
    for line in fhand:
        print(line,end="")

# ---
    
# DONE ✅ 
def main():
    overall_token_array:list[tuple] = []
    file_str:str = ""
    file_name:str = input("Name of dc file: ").split(".")[0]
    fhand = open(f"../samples/{file_name}.dc", "r") 
    for line in fhand:
        file_str += f"{line.strip()}"
    dc_array:list[str]= file_str.split("---")
    fhand.close()
    # print(dc_array)

    for dc in dc_array:
        try:
            each_token_array = lx.lexer(dc)
            overall_token_array.append((file_name, each_token_array))
        except ValueError as e:
            print(f"Error log: {e}") # error logging 
    return overall_token_array

# ---

# DONE ✅ 
def event_loop() -> None:
    dc_array:list[tuple] | None = inter.parser_interpreter(main()) # expressing the possible enums
    if dc_array is not None:
        for dc in dc_array:
            dc_file_name:str = dc[0] 
            dc_file_contents:str = dc[1]

            if "|" in dc_file_name:
                os.system("clear")
                match dc_file_name.split("|")[-1]:
                    case "PDF":
                        dc_file_name = dc_file_name.split("|")[0]
                        fhand = open(dc_file_name,"w")
                        fhand.write(dc_file_contents)
                        fhand.close()
                        os.system(f"rmarkdown::render('{dc_file_name}')")
                        print(f"DC4U has created your file: {dc_file_name}")

                    case "DOCX":
                        dc_file_name = dc_file_name.split("|")[0]
                        fhand = open(dc_file_name,"w")
                        fhand.write(dc_file_contents)
                        fhand.close()
                        os.system(f"rmarkdown::render('{dc_file_name}')")
                        print(f"DC4U has created your file: {dc_file_name}")
            else:
                fhand = open(dc_file_name,"w")
                fhand.write(dc_file_contents)
                fhand.close()
                print(f"DC4U has created your file: {dc_file_name}")
    return None

# ---

event_loop()

