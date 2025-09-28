from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List
from pathlib import Path
from app.models import Product  # Your Product model

app = FastAPI()

# Dynamically locate the templates folder
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# In-memory storage
products: List[Product] = []
cart: List[Product] = []

# Store front
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {"products": products})

# Admin - add product page
@app.get("/add", response_class=HTMLResponse)
def add_product_page(request: Request):
    return templates.TemplateResponse(request, "add_product.html")

# Admin - handle add product form
@app.post("/add", response_class=HTMLResponse)
def add_product_form(
    request: Request,
    id: int = Form(...),
    name: str = Form(...),
    sku: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...)
):
    product = Product(id=id, name=name, sku=sku, price=price, stock=stock)
    products.append(product)
    return templates.TemplateResponse(request, "index.html", {"products": products})

# Add product to cart
@app.post("/add-to-cart/{product_id}", response_class=HTMLResponse)
def add_to_cart(request: Request, product_id: int):
    for product in products:
        if product.id == product_id:
            cart.append(product)
            break
    total = sum(p.price for p in cart)
    return templates.TemplateResponse(request, "cart.html", {"cart": cart, "total": total})

# View cart
@app.get("/cart", response_class=HTMLResponse)
def view_cart(request: Request):
    total = sum(p.price for p in cart)
    return templates.TemplateResponse(request, "cart.html", {"cart": cart, "total": total})
