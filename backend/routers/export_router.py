"""
笔记导出路由
支持PDF导出和批量导出功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse, StreamingResponse
from typing import List
from auth import get_current_user
from models import User
from database_sqlite import notes_repo
import io
import zipfile
from datetime import datetime

router = APIRouter(prefix="/export", tags=["export"])

def html_to_simple_pdf(html_content: str, title: str) -> bytes:
    """
    将HTML转换为简单的PDF（使用reportlab）
    这是一个简化实现，生产环境建议使用 weasyprint 或 pdfkit
    """
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import html

        # 创建PDF缓冲区
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)

        # 定义样式
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
        )

        content_style = ParagraphStyle(
            'CustomContent',
            parent=styles['BodyText'],
            fontSize=12,
            leading=14,
        )

        # 构建内容
        story = []

        # 标题
        story.append(Paragraph(html.escape(title), title_style))
        story.append(Spacer(1, 0.2 * inch))

        # 内容（简单文本处理）
        # 移除HTML标签（简化版）
        import re
        text_content = re.sub('<[^<]+?>', '', html_content)
        text_content = html.unescape(text_content)

        # 分段处理
        paragraphs = text_content.split('\n')
        for para in paragraphs:
            if para.strip():
                story.append(Paragraph(html.escape(para), content_style))
                story.append(Spacer(1, 0.1 * inch))

        # 生成PDF
        doc.build(story)
        pdf_data = buffer.getvalue()
        buffer.close()

        return pdf_data

    except ImportError:
        # 如果没有安装reportlab，返回HTML作为备用
        raise HTTPException(
            status_code=503,
            detail="PDF导出功能需要安装reportlab库。请运行: pip install reportlab"
        )

@router.get("/pdf/{note_id}")
async def export_note_to_pdf(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    将单个笔记导出为PDF
    """
    note = notes_repo.get_note(note_id)

    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    if note['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="无权限导出此笔记")

    try:
        # 生成PDF
        pdf_content = html_to_simple_pdf(note['content'], note['title'])

        # 生成文件名
        filename = f"{note['title'][:30]}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filename = filename.replace(' ', '_')

        # 返回PDF文件
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF导出失败: {str(e)}"
        )

@router.get("/html/{note_id}")
async def export_note_to_html(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    将单个笔记导出为HTML
    """
    note = notes_repo.get_note(note_id)

    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    if note['user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="无权限导出此笔记")

    # 生成完整的HTML文档
    html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{note['title']}</title>
    <style>
        body {{
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }}
        .metadata {{
            color: #7f8c8d;
            font-size: 0.9em;
            margin-bottom: 20px;
        }}
        .content {{
            margin-top: 30px;
        }}
        code {{
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
        }}
        pre {{
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
    </style>
</head>
<body>
    <h1>{note['title']}</h1>
    <div class="metadata">
        创建时间: {note.get('created_at', 'N/A')}<br>
        标签: {', '.join(note.get('tags', []))}
    </div>
    <div class="content">
        {note['content']}
    </div>
</body>
</html>"""

    filename = f"{note['title'][:30]}_{datetime.now().strftime('%Y%m%d')}.html"
    filename = filename.replace(' ', '_')

    return StreamingResponse(
        io.BytesIO(html_content.encode('utf-8')),
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.post("/batch")
async def batch_export_notes(
    note_ids: List[str],
    format: str = "html",  # html 或 pdf
    current_user: User = Depends(get_current_user)
):
    """
    批量导出笔记为ZIP文件
    """
    if not note_ids:
        raise HTTPException(status_code=400, detail="请选择要导出的笔记")

    if len(note_ids) > 100:
        raise HTTPException(status_code=400, detail="一次最多导出100个笔记")

    # 创建ZIP文件
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for note_id in note_ids:
            note = notes_repo.get_note(note_id)

            if not note or note['user_id'] != current_user.id:
                continue  # 跳过无权限的笔记

            # 生成文件名
            safe_title = note['title'][:30].replace(' ', '_').replace('/', '_')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            if format == "pdf":
                try:
                    # 生成PDF
                    pdf_content = html_to_simple_pdf(note['content'], note['title'])
                    filename = f"{safe_title}_{timestamp}.pdf"
                    zip_file.writestr(filename, pdf_content)
                except Exception as e:
                    # PDF生成失败，跳过
                    print(f"PDF生成失败: {str(e)}")
                    continue
            else:
                # 生成HTML
                html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{note['title']}</title>
    <style>
        body {{ font-family: 'PingFang SC', Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; }}
        h1 {{ color: #2c3e50; }}
    </style>
</head>
<body>
    <h1>{note['title']}</h1>
    <div>{note['content']}</div>
</body>
</html>"""
                filename = f"{safe_title}_{timestamp}.html"
                zip_file.writestr(filename, html_content.encode('utf-8'))

    zip_buffer.seek(0)

    # 生成ZIP文件名
    zip_filename = f"notes_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={zip_filename}"
        }
    )
