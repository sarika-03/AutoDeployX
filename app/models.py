from pydantic import BaseModel

class Product(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    stock: int
