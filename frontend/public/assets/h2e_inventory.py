
import customtkinter as ctk
import sqlite3
from fpdf import FPDF
from tkinter import messagebox

# --- Configurações da Aplicação --- #
APP_NAME = "h2e - Controle de Estoque"
DB_NAME = "h2e_inventory.db"

# --- Configurações Visuais (CustomTkinter) --- #
ctk.set_appearance_mode("dark")  # Modo escuro para o tema espacial
ctk.set_default_color_theme("blue")  # Tema azul para puxar para o roxo/espacial

# --- Funções do Banco de Dados --- #
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            quantity INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def add_product_to_db(name, quantity):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO products (name, quantity) VALUES (?, ?)", (name, quantity))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        messagebox.showerror("Erro", f"O produto '{name}' já existe no estoque.")
        return False
    finally:
        conn.close()

def get_all_products_from_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT name, quantity FROM products ORDER BY name")
    products = cursor.fetchall()
    conn.close()
    return products

def update_product_quantity_in_db(name, quantity_change):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT quantity FROM products WHERE name = ?", (name,))
    current_quantity = cursor.fetchone()

    if current_quantity is None:
        messagebox.showerror("Erro", f"Produto '{name}' não encontrado.")
        conn.close()
        return False

    new_quantity = current_quantity[0] + quantity_change
    if new_quantity < 0:
        messagebox.showerror("Erro", f"Quantidade insuficiente em estoque para '{name}'. Disponível: {current_quantity[0]}")
        conn.close()
        return False

    cursor.execute("UPDATE products SET quantity = ? WHERE name = ?", (new_quantity, name))
    conn.commit()
    conn.close()
    return True

# --- Classe Principal da Aplicação --- #
class H2EApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title(APP_NAME)
        self.geometry("800x600")

        # Configurar layout da grade (2 colunas)
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1) # Linha para a lista de produtos

        # --- Frame de Cadastro de Produto --- #
        self.register_frame = ctk.CTkFrame(self)
        self.register_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.register_frame.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(self.register_frame, text="Cadastrar Produto", font=("Arial", 16, "bold")).grid(row=0, column=0, columnspan=2, pady=5)

        ctk.CTkLabel(self.register_frame, text="Nome do Produto:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.product_name_entry = ctk.CTkEntry(self.register_frame)
        self.product_name_entry.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        ctk.CTkLabel(self.register_frame, text="Quantidade Inicial:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.initial_quantity_entry = ctk.CTkEntry(self.register_frame)
        self.initial_quantity_entry.grid(row=2, column=1, padx=5, pady=5, sticky="ew")

        self.add_product_button = ctk.CTkButton(self.register_frame, text="Adicionar Produto", command=self.add_product)
        self.add_product_button.grid(row=3, column=0, columnspan=2, pady=10)

        # --- Frame de Retirada de Produto --- #
        self.withdraw_frame = ctk.CTkFrame(self)
        self.withdraw_frame.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        self.withdraw_frame.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(self.withdraw_frame, text="Retirar Produto", font=("Arial", 16, "bold")).grid(row=0, column=0, columnspan=2, pady=5)

        ctk.CTkLabel(self.withdraw_frame, text="Nome do Produto:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.withdraw_product_name_entry = ctk.CTkEntry(self.withdraw_frame)
        self.withdraw_product_name_entry.grid(row=1, column=1, padx=5, pady=5, sticky="ew")

        ctk.CTkLabel(self.withdraw_frame, text="Quantidade a Retirar:").grid(row=2, column=0, padx=5, pady=5, sticky="w")
        self.withdraw_quantity_entry = ctk.CTkEntry(self.withdraw_frame)
        self.withdraw_quantity_entry.grid(row=2, column=1, padx=5, pady=5, sticky="ew")

        self.withdraw_button = ctk.CTkButton(self.withdraw_frame, text="Retirar", command=self.withdraw_product)
        self.withdraw_button.grid(row=3, column=0, columnspan=2, pady=10)

        # --- Frame de Exibição do Estoque --- #
        self.stock_display_frame = ctk.CTkFrame(self)
        self.stock_display_frame.grid(row=1, column=0, columnspan=2, padx=10, pady=10, sticky="nsew")
        self.stock_display_frame.grid_columnconfigure(0, weight=1)
        self.stock_display_frame.grid_rowconfigure(1, weight=1)

        ctk.CTkLabel(self.stock_display_frame, text="Estoque Atual", font=("Arial", 16, "bold")).grid(row=0, column=0, pady=5)

        self.stock_textbox = ctk.CTkTextbox(self.stock_display_frame, wrap="word")
        self.stock_textbox.grid(row=1, column=0, padx=5, pady=5, sticky="nsew")
        self.stock_textbox.configure(state="disabled") # Desabilitar edição direta

        # --- Botão de Exportar PDF --- #
        self.export_pdf_button = ctk.CTkButton(self, text="Exportar Estoque para PDF", command=self.export_to_pdf)
        self.export_pdf_button.grid(row=2, column=0, columnspan=2, pady=10)

        self.update_stock_display()

    def add_product(self):
        name = self.product_name_entry.get().strip()
        quantity_str = self.initial_quantity_entry.get().strip()

        if not name or not quantity_str:
            messagebox.showwarning("Aviso", "Por favor, preencha todos os campos para adicionar um produto.")
            return

        try:
            quantity = int(quantity_str)
            if quantity < 0:
                messagebox.showwarning("Aviso", "A quantidade inicial não pode ser negativa.")
                return
        except ValueError:
            messagebox.showerror("Erro", "Quantidade inicial deve ser um número inteiro.")
            return

        if add_product_to_db(name, quantity):
            messagebox.showinfo("Sucesso", f"Produto '{name}' adicionado com sucesso!")
            self.product_name_entry.delete(0, ctk.END)
            self.initial_quantity_entry.delete(0, ctk.END)
            self.update_stock_display()

    def withdraw_product(self):
        name = self.withdraw_product_name_entry.get().strip()
        quantity_str = self.withdraw_quantity_entry.get().strip()

        if not name or not quantity_str:
            messagebox.showwarning("Aviso", "Por favor, preencha todos os campos para retirar um produto.")
            return

        try:
            quantity = int(quantity_str)
            if quantity <= 0:
                messagebox.showwarning("Aviso", "A quantidade a retirar deve ser um número positivo.")
                return
        except ValueError:
            messagebox.showerror("Erro", "Quantidade a retirar deve ser um número inteiro.")
            return

        if update_product_quantity_in_db(name, -quantity):
            messagebox.showinfo("Sucesso", f"'{quantity}' unidades de '{name}' retiradas com sucesso!")
            self.withdraw_product_name_entry.delete(0, ctk.END)
            self.withdraw_quantity_entry.delete(0, ctk.END)
            self.update_stock_display()

    def update_stock_display(self):
        products = get_all_products_from_db()
        self.stock_textbox.configure(state="normal")
        self.stock_textbox.delete("1.0", ctk.END)
        if products:
            self.stock_textbox.insert(ctk.END, "Produto\t\tQuantidade\n")
            self.stock_textbox.insert(ctk.END, "-------------------------------------\n")
            for name, quantity in products:
                self.stock_textbox.insert(ctk.END, f"{name}\t\t{quantity}\n")
        else:
            self.stock_textbox.insert(ctk.END, "Nenhum produto em estoque.")
        self.stock_textbox.configure(state="disabled")

    def export_to_pdf(self):
        products = get_all_products_from_db()
        if not products:
            messagebox.showwarning("Aviso", "Não há produtos em estoque para exportar.")
            return

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(200, 10, txt="Relatório de Estoque h2e", ln=True, align="C")
        pdf.set_font("Arial", size=12)
        pdf.ln(10)

        # Cabeçalho da tabela
        pdf.cell(90, 10, "Produto", 1, 0, "C")
        pdf.cell(90, 10, "Quantidade", 1, 1, "C")

        for name, quantity in products:
            pdf.cell(90, 10, name, 1, 0, "L")
            pdf.cell(90, 10, str(quantity), 1, 1, "C")

        try:
            pdf_filename = "h2e_relatorio_estoque.pdf"
            pdf.output(pdf_filename)
            messagebox.showinfo("Sucesso", f"Relatório de estoque exportado para '{pdf_filename}'")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar PDF: {e}")

# --- Inicialização da Aplicação --- #
if __name__ == "__main__":
    init_db()
    app = H2EApp()
    app.mainloop()
